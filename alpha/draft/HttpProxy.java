import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.FilterInputStream;
import java.io.FilterOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

import javax.net.ServerSocketFactory;
import javax.net.SocketFactory;

public class HttpProxy {

  public static void main(final String[] args) throws Exception {
    new HttpProxy().start();
  }

  protected static final Console console = new Console();
  protected static class Console {
    public void log(final Object o) {
      out("INFO ", o);
    }
    public void error(final Object o) {
      out("ERROR", o);
    }
    protected void out(final String level, final Object msg) {
      final String timestamp =
          new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSS").format(new Date() );
      System.out.println(timestamp + " [" + level +
          "] [" + Thread.currentThread().getName() +  "] - " + msg);
    }
  }

  protected static NetworkEmulator emu;
  private ServerSocket serverSocket;
  private ExecutorService es;
  private int port = 9900;

  public void start() throws Exception {

    console.log("starting http-proxy...");

    // emulate slow network.
    emu = new NetworkEmulator();
    emu.start();

    serverSocket = ServerSocketFactory.getDefault().createServerSocket(port);
    console.log("server started at port " + port);

    final int[] id = { 1 };
    es = Executors.newCachedThreadPool(new ThreadFactory() {
      @Override
      public Thread newThread(Runnable r) {
        Thread thread = new Thread(r);
        thread.setName("proxy-" + id[0]++);
        return thread;
      }
    });
    while (true) {
      es.execute(new HttpSession(serverSocket.accept() ) );
    }
  }

  protected static HttpStream createCltStream(final Socket socket) throws IOException {
    InputStream in = new BufferedInputStream(socket.getInputStream() );
    OutputStream out = new BufferedOutputStream(socket.getOutputStream() );
    in = emu.wrap(in);
    out = emu.wrap(out);
    return new HttpStream(in, out);
  }
  protected static HttpStream createSvrStream(final Socket socket) throws IOException {
    InputStream in = new BufferedInputStream(socket.getInputStream() );
    OutputStream out = new BufferedOutputStream(socket.getOutputStream() );
    in = emu.wrap(in);
    out = emu.wrap(out);
    return new HttpStream(in, out);
  }

  protected static class NetworkEmulator {
    private static final long BPS = 10L * 1000 * 1000 / 8;
    private static final long FEED_INTERVAL_IN_MILLIS = 50L;
    private final Object lock = new Object();
    private Executor es;
    private long rest = 0;
    public NetworkEmulator() {
    }
    public void start() {
      console.log("network speed:" + BPS + "[bytes per second]");
      es = Executors.newSingleThreadExecutor(new ThreadFactory() {
        @Override
        public Thread newThread(Runnable r) {
          Thread t = new Thread(r);
          t.setName("network-feeder");
          return t;
        }
      });
      es.execute(new Runnable() {
        @Override
        public void run() {
          try {
            doTimer();
          } catch(RuntimeException e) {
            throw e;
          } catch(Exception e) {
            throw new RuntimeException(e);
          }
        }
      });
      console.log("timer started.");
    }
    protected void doTimer() throws Exception {
      long lastTime = System.currentTimeMillis();
      while (true) {
        synchronized(lock) {
          final long time = System.currentTimeMillis();
          final long feed = BPS * (time - lastTime) / 1000;
          rest = feed;
          lastTime = time;
          lock.notifyAll();
        }
        Thread.sleep(FEED_INTERVAL_IN_MILLIS);
      }
    }
    protected void consume() {
      synchronized(lock) {
        try {
          while (!(rest > 0) ) {
            lock.wait();
          }
        } catch(InterruptedException e) {
          throw new RuntimeException(e);
        }
        rest -= 1;
      }
    }
    public InputStream wrap(final InputStream in) {
      return new InputStream() {
        @Override
        public int read() throws IOException {
          consume();
          return in.read();
        }
      };
    }
    public OutputStream wrap(final OutputStream out) {
      return new OutputStream() {
        @Override
        public void write(final int b) throws IOException {
          consume();
          out.write(b);
        }
        @Override
        public void flush() throws IOException {
          out.flush();
        }
      };
    }
  }

  public static class HttpSession implements Runnable{

    private final Socket cltSocket;

    private HttpStream cltStream;
    private HttpStream svrStream;

    private HttpHeader reqHeader;
    private HttpHeader resHeader;

    public HttpSession(final Socket cltSocket) {
      this.cltSocket = cltSocket;
    }

    protected void doProxyRequest() throws Exception {

      svrStream.out.println(reqHeader.getStartLine() );
      int reqContentLength = -1;
      for (Entry<String, List<String>> header :
          reqHeader.getHeaders().entrySet() ) {
        final String key = header.getKey().toLowerCase();
        if (key.contains("proxy") ) {
          console.log("skip header:" + key);
          continue;
        }
        for (final String value : header.getValue() ) {
          if (key.equals(CONTENT_LENGTH) ) {
            reqContentLength = Integer.parseInt(value);
          }
          svrStream.out.println(header.getKey() + ": " + value);
        }
      }
      svrStream.out.println();
      svrStream.out.flush();
      if (reqContentLength != -1) {
        copyFully(cltStream.in, svrStream.out, reqContentLength);
      }
      svrStream.out.flush();
    }

    protected void doProxyResponse() throws Exception {

      resHeader = HttpHeader.readFrom(svrStream.in);
      console.log(resHeader.getStartLine() );
      console.log(resHeader.getHeaders() );

      cltStream.out.println(resHeader.getStartLine() );
      int resContentLength = -1;
      boolean chunked = false;
      for (Entry<String, List<String>> header :
          resHeader.getHeaders().entrySet() ) {
        final String key = header.getKey().toLowerCase();
        for (final String value : header.getValue() ) {
          if (key.equals(CONTENT_LENGTH) ) {
            resContentLength = Integer.parseInt(value);
          } else if (key.equals(TRANSFER_ENCODING) ) {
            chunked = value.equals(CHUNKED);
          }
          cltStream.out.println(header.getKey() + ": " + value);
        }
      }
      cltStream.out.println();
      cltStream.out.flush();

      if (resContentLength != -1) {
        copyFully(svrStream.in, cltStream.out, resContentLength);
      } else if (chunked) {
        while (true) {
          final String chunk = svrStream.in.readLine();
          final int chunkSize = Integer.parseInt(chunk, 16);
          cltStream.out.println(chunk);
          copyFully(svrStream.in, cltStream.out, chunkSize);
          cltStream.out.println(svrStream.in.readLine() );
          cltStream.out.flush();
          if (chunkSize == 0) {
            break;
          }
        }
      } else {
        copyFully(svrStream.in, cltStream.out);
      }
      cltStream.out.flush();
    }
    protected void doProxy() throws Exception {
      try {

        cltStream = createCltStream(cltSocket);

        reqHeader = HttpHeader.readFrom(cltStream.in);
        console.log(reqHeader.getStartLine() );
        console.log(reqHeader.getHeaders() );

        final String[] reqTokens = reqHeader.getStartLine().split("\\u0020");
        if (reqTokens.length != 3) {
          throw new IOException("bad start line:" + reqHeader.getStartLine() );
        }
        final String reqMethod = reqTokens[0];
        final String reqUrl = reqTokens[1];
        final String reqVersion = reqTokens[2];

        if (reqMethod.equals("CONNECT") ) {
          console.error("method not supported:" + reqMethod);
          return;
        }

        final URL reqURL = new URL(reqUrl);
        if (!(reqURL.getHost().equals("localhost") ||
            reqURL.getHost().startsWith("192.168.") ) ) {
          console.error("bad host:" + reqURL.getHost() );
          return;
        }
        // rewrite start line.
        reqHeader.setStartLine(reqMethod + " " +
            reqURL.getFile() + " " + reqVersion);

        final Socket svrSocket = SocketFactory.getDefault().createSocket(
            reqURL.getHost(), reqURL.getPort() != -1? reqURL.getPort(): 80);
        try {

          svrStream = createSvrStream(svrSocket);

          doProxyRequest();
          doProxyResponse();

        } finally {
          svrSocket.close();
        }

      } finally {
        cltSocket.close();
      }
    }
    @Override
    public void run() {
      try {
        doProxy();
      } catch(RuntimeException e) {
        throw e;
      } catch(EOFException e) {
      } catch(Exception e) {
        throw new RuntimeException(e);
      }
    }
  }
  protected static class HttpHeader {
    private String startLine;
    private Map<String, List<String>> headers =
        new LinkedHashMap<String, List<String>>();
    public HttpHeader() {
    }
    public String getStartLine() {
      return startLine;
    }
    public void setStartLine(String startLine) {
      this.startLine = startLine;
    }
    public Map<String, List<String>> getHeaders() {
      return headers;
    }
    public void setHeaders(Map<String, List<String>> headers) {
      this.headers = headers;
    }
    public static HttpHeader readFrom(HttpInputStream in)
    throws IOException {
      final HttpHeader header = new HttpHeader();
      header.setStartLine(in.readLine() );
      while (true) {
        final String line = in.readLine();
        if (line.length() == 0) {
          break;
        }
        final int index = line.indexOf(':');
        if (index == -1) {
          throw new IOException("unexpected header:" + line);
        }
        final String k = line.substring(0, index).trim();
        final String v = line.substring(index + 1).trim();
        List<String> values = header.getHeaders().get(k);
        if (values == null) {
          values = new ArrayList<String>(1);
          header.getHeaders().put(k, values);
        }
        values.add(v);
      }
      return header;
    }
  }
  public static class HttpStream {
    public final HttpInputStream in;
    public final HttpOutputStream out;
    public HttpStream(InputStream in, OutputStream out) {
      this.in = new HttpInputStream(in);
      this.out = new HttpOutputStream(out);
    }
  }
  protected static final String CONTENT_LENGTH = "content-length";
  protected static final String TRANSFER_ENCODING = "transfer-encoding";
  protected static final String CHUNKED = "chunked";

  protected static final String US_ASCII = "ISO-8859-1";
  protected static final int CR = '\r';
  protected static final int LF = '\n';

  protected static class HttpInputStream extends FilterInputStream {
    public HttpInputStream(final InputStream in) {
      super(in);
    }
    public String readLine() throws IOException {
      final ByteArrayOutputStream bout = new ByteArrayOutputStream();
      try {
        int b;
        while ( (b = read() ) != -1) {
          if (b == CR) {
            b = in.read();
            if (b != LF) {
              throw new IOException("unexpected eol:" + b);
            }
            // <CR><LF>
            break;
          }
          bout.write(b);
        }
      } finally {
        bout.close();
      }
      return new String(bout.toByteArray(), US_ASCII);
    }
  }
  protected static class HttpOutputStream extends FilterOutputStream {
    public HttpOutputStream(OutputStream out) {
      super(out);
    }
    public void print(final String line) throws IOException {
      write(line.getBytes(US_ASCII) );
    }
    public void println() throws IOException {
      write(CR);
      write(LF);
    }
    public void println(final String line) throws IOException {
      print(line);
      println();
    }
  }
  public static int copyFully(
      final InputStream in,
      final OutputStream out, final int length) throws Exception {
    final byte[] buf = new byte[8192];
    int readLen = 0;
    while (readLen < length) {
      final int len = in.read(buf, 0, Math.min(buf.length, length - readLen) );
      if (len == -1) {
        throw new EOFException();
      }
      out.write(buf, 0, len);
      readLen += len;
    }
    return readLen;
  }
  public static int copyFully(
      final InputStream in,
      final OutputStream out) throws Exception {
    final byte[] buf = new byte[8192];
    int readLen = 0;
    while (true) {
      final int len = in.read(buf);
      if (len == -1) {
        break;
      }
      out.write(buf, 0, len);
      readLen += len;
    }
    return readLen;
  }
}
