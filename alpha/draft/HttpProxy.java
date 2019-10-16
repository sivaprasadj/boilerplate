import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.Reader;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketException;
import java.net.URL;
import java.text.DecimalFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;
import java.util.regex.Pattern;

import javax.net.ServerSocketFactory;
import javax.net.SocketFactory;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;


public class HttpProxy {

  public interface HttpContext {
    String DIRECT = "DIRECT";
    String getProxy(String host);
    HttpStream createStream(Socket socket) throws IOException;
    EventTarget getEventTarget();
  }

  public static void main(final String[] args) throws Exception {
    new HttpProxy().start();
  }

  private ServerSocket serverSocket;
  private ExecutorService es;
  private EventTarget eventTarget;

  public HttpProxy() {
  }

  public void start() throws Exception {

    console.log("starting http-proxy...");

    eventTarget = new EventTarget();

    // load script config
    final Map<?,?> config = loadConfig();

    final int port = ((Number)config.get("port") ).intValue();
    serverSocket = ServerSocketFactory.getDefault().createServerSocket(port);
    console.log("server started at port " + port);

    final String directHosts = (String)config.get("directHosts");
    console.log("direct hosts: " + directHosts);

    final List<Pattern> directHostPats = parseHosts(directHosts);
    final String proxy = (String)config.get("proxy");
    console.log("proxy: " + (proxy != null? proxy : "none") );

    // emulate slow network.
    final NetworkEmulator emu = new NetworkEmulator();
    emu.setBps(( (Number)config.get("bps") ).longValue() );
    emu.start();

    final HttpContext context = new HttpContext() {

      @Override
      public EventTarget getEventTarget() {
        return eventTarget;
      }

      @Override
      public String getProxy(final String host) {
        if (proxy == null) {
          return DIRECT;
        } else {
          for (final Pattern pat : directHostPats) {
            if (pat.matcher(host).matches() ) {
              return DIRECT;
            }
          }
          return proxy;
        }
      }

      @Override
      public HttpStream createStream(final Socket socket) throws IOException {
        ByteInput in = new ByteInput() {
          private final InputStream in =
              new BufferedInputStream(socket.getInputStream() );
          @Override
          public int read() throws IOException {
            return in.read();
          }
         };
        ByteOutput out = new ByteOutput() {
          private final OutputStream out =
              new BufferedOutputStream(socket.getOutputStream() );
          @Override
          public void write(final int b) throws IOException {
            out.write(b);
          }
          @Override
          public void flush() throws IOException {
            out.flush();
          }
        };
        in = emu.wrap(in);
        out = emu.wrap(out);
        return new HttpStream(in, out);
      }
    };

    final int[] id = { 1 };
    es = Executors.newFixedThreadPool(50, new ThreadFactory() {
      @Override
      public Thread newThread(final Runnable r) {
        final Thread t = new Thread(r);
        t.setName("proxy-" + id[0]++);
        return t;
      }
    });
    while (true) {
      es.execute(new HttpSession(context, serverSocket.accept() ) );
    }
  }
  protected Map<?,?> loadConfig() throws Exception {
    final ScriptEngine se = new ScriptEngineManager().getEngineByName("javascript");
    final Map<?,?> config = new LinkedHashMap<Object, Object>();
    se.put("$console", console);
    se.put("$eventTarget", eventTarget);
    se.put("$config", config);
    eval(se, "HttpProxy.config.0.js");
    eval(se, "/HttpProxy.config.js");
    return config;
  }
  protected Object eval(final ScriptEngine se,
      final String scriptPath) throws Exception {
    URL url = getClass().getResource(scriptPath);
    if (url == null) {
      url = getClass().getClassLoader().getResource(scriptPath);
    }
    if (url == null) {
      url = ClassLoader.getSystemResource(scriptPath);
    }
    if (url == null) {
      return null;
    }
    final Reader reader = new InputStreamReader(url.openStream(), "UTF-8");
    try {
      console.log("eval: " + url);
      se.put(ScriptEngine.FILENAME, url.toString() );
      return se.eval(reader);
    } finally {
      reader.close();
    }
  }
  protected static List<Pattern> parseHosts(final String hosts) {
    final List<Pattern> hostPats = new ArrayList<Pattern>();
    for (String host : Arrays.asList(hosts.split("[,;\\s]+") ) ) {
      final StringBuilder buf = new StringBuilder();
      buf.append('^');
      int start = 0;
      int index;
      while ( (index = host.indexOf('*', start) ) != -1) {
        buf.append(Pattern.quote(host.substring(start, index) ) );
        buf.append(".+");
        start = index + 1;
      }
      buf.append(Pattern.quote(host.substring(start) ) );
      buf.append('$');
      hostPats.add(Pattern.compile(buf.toString() ) );
    }
    return hostPats;
  }

  protected static class NetworkEmulator {
    private static final long FEED_INTERVAL_IN_MILLIS = 50L;
    private final Object lock = new Object();
    private Executor es;
    private long bps = 0;
    private long bufInBits = 0;
    public NetworkEmulator() {
    }
    public long getBps() {
      return bps;
    }
    public void setBps(long bps) {
      final DecimalFormat fmt = new DecimalFormat("###,###,###,###,##0");
      console.log("network speed: " + fmt.format(bps / 8) +
          "[bytes per second] (" +
          fmt.format(bps / 1024 / 1024) + "Mbps)");
      this.bps = bps;
    }
    public void start() {
      es = Executors.newSingleThreadExecutor(new ThreadFactory() {
        @Override
        public Thread newThread(final Runnable r) {
          final Thread t = new Thread(r);
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
      console.log("network emulator started.");
    }
    protected void doTimer() throws Exception {
      long lastTime = System.currentTimeMillis();
      while (true) {
        synchronized(lock) {
          final long time = System.currentTimeMillis();
          final long feed = bps * (time - lastTime) / 1000;
          bufInBits = feed;
          lastTime = time;
          lock.notifyAll();
        }
        Thread.sleep(FEED_INTERVAL_IN_MILLIS);
      }
    }
    protected void consume() {
      synchronized(lock) {
        try {
          while (bufInBits < 8) {
            lock.wait();
          }
        } catch(InterruptedException e) {
          throw new RuntimeException(e);
        }
        bufInBits -= 8;
      }
    }
    public ByteInput wrap(final ByteInput in) {
      return new ByteInput() {
        @Override
        public int read() throws IOException {
          consume();
          return in.read();
        }
      };
    }
    public ByteOutput wrap(final ByteOutput out) {
      return new ByteOutput() {
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

  public interface HttpHandler {
    void handle(HttpContext context,
        HttpStream cltStream, HttpHeader requestHeader) throws Exception;
  }

  protected static abstract class AbstractProxyHandler
  implements HttpHandler {
    private String targetHost;
    private int targetPort;
    private boolean targetProxy;
    protected AbstractProxyHandler() {
    }
    public String getTargetHost() {
      return targetHost;
    }
    public void setTargetHost(String targetHost) {
      this.targetHost = targetHost;
    }
    public int getTargetPort() {
      return targetPort;
    }
    public void setTargetPort(int targetPort) {
      this.targetPort = targetPort;
    }
    public boolean isTargetProxy() {
      return targetProxy;
    }
    public void setTargetProxy(boolean targetProxy) {
      this.targetProxy = targetProxy;
    }
  }

  protected static class ConnectorHandler extends AbstractProxyHandler {

    @Override
    public void handle(
        final HttpContext context,
        final HttpStream cltStream,
        final HttpHeader requestHeader) throws Exception {

      final long startTime = System.currentTimeMillis();

      final Socket svrSocket = SocketFactory.getDefault().
          createSocket(getTargetHost(), getTargetPort() );
      try {

        final HttpStream svrStream = context.createStream(svrSocket);

        if (isTargetProxy() ) {

          svrStream.out.println(requestHeader.getStartLine() );
          for (final String key : requestHeader.getHeaderNames() ) {
            for (final String value : requestHeader.getHeaderValues(key) ) {
              svrStream.out.println(key + ": " + value);
            }
          }
          svrStream.out.println();
          svrStream.out.flush();
        }

        final HttpHeader responseHeader;
        if (isTargetProxy() ) {
          responseHeader = HttpHeader.readFrom(svrStream.in);
        } else{
          responseHeader = new HttpHeader();
          responseHeader.setStartLine("HTTP/1.1 200 Connection established");
        }

        console.log(responseHeader.getStartLine() );
        if (responseHeader.getHeaderNames().iterator().hasNext() ) {
          console.log(responseHeader.getHeadersAsString() );
        }

        cltStream.out.println(responseHeader.getStartLine() );
        for (final String key : responseHeader.getHeaderNames() ) {
          for (final String value : responseHeader.getHeaderValues(key) ) {
            cltStream.out.println(key + ": " + value);
          }
        }
        cltStream.out.println();
        cltStream.out.flush();

        final Future<Integer> reqCon =
            connect(cltStream.in, svrStream.out, false);
        final Future<Integer> resCon =
            connect(svrStream.in, cltStream.out, true);

        final int reqLen = reqCon.get().intValue();
        final int resLen = resCon.get().intValue();

        final long time = System.currentTimeMillis() - startTime;
        final StringBuilder buf = new StringBuilder();
        buf.append("done");
        buf.append("/req-length: ");
        buf.append(reqLen);
        buf.append("/res-length: ");
        buf.append(resLen);
        buf.append("/");
        buf.append(time);
        buf.append("ms");
        console.log(buf.toString() );

      } finally {
        svrSocket.close();
      }
    }

    private static int connId = 1;
    private static final ExecutorService connectorService =
        Executors.newCachedThreadPool(new ThreadFactory() {
          @Override
          public Thread newThread(final Runnable r) {
            final Thread t = new Thread(r);
            t.setName("connector-" + connId++);
            return t;
          }
        });

    protected static Future<Integer> connect(
        final ByteInput in, final ByteOutput out, final boolean response) {
      return connectorService.submit(new Callable<Integer>() {
        @Override
        public Integer call() throws Exception {
            int readLen = 0;
            while (true) {
              try {
                final int b = in.read();
                if (b == -1) {
                  break;
                }
                try {
                  out.write(b);
                  out.flush();
                } catch(SocketException e) {
                  if (response) {
                    console.log("response aborted.");
                    break;
                  } else {
                    throw e;
                  }
                }
                readLen += 1;
              } catch(SocketException e) {
                console.error(e);
                break;
              }
            }
            return Integer.valueOf(readLen);
        }
      });
    }
  }

  protected static class ProxyHandler extends AbstractProxyHandler {

    private HttpStream cltStream;
    private HttpHeader requestHeader;

    private HttpStream svrStream;
    private HttpHeader responseHeader;

    private long startTime;

    public ProxyHandler() {
    }

    @Override
    public void handle(
        final HttpContext context,
        final HttpStream cltStream,
        final HttpHeader requestHeader) throws Exception {

      startTime = System.currentTimeMillis();

      this.cltStream = cltStream;
      this.requestHeader = requestHeader;

      final Socket svrSocket = SocketFactory.getDefault().
          createSocket(getTargetHost(), getTargetPort() );
      try {

        svrStream = context.createStream(svrSocket);

        doRequest(context);
        doResponse(context);

      } finally {
        svrSocket.close();
      }
    }

    protected void doRequest(final HttpContext context) throws Exception {

      context.getEventTarget().trigger("beforerequest",
          map("targetHost", getTargetHost(),
              "targetPort", Integer.valueOf(getTargetPort() ),
              "targetProxy", Boolean.valueOf(isTargetProxy() ),
              "requestHeader", requestHeader) );

      svrStream.out.println(requestHeader.getStartLine() );
      int reqContentLength = -1;
      for (String key : requestHeader.getHeaderNames() ) {
        final String lcKey = key.toLowerCase();
        if (!isTargetProxy() && lcKey.equals(Constants.PROXY_CONNECTION) ) {
          console.log("skip header: " + key);
          continue;
        }
        for (final String value : requestHeader.getHeaderValues(key) ) {
          if (lcKey.equals(Constants.CONTENT_LENGTH) ) {
            reqContentLength = Integer.parseInt(value);
          }
          svrStream.out.println(key + ": " + value);
        }
      }
      svrStream.out.println();
      svrStream.out.flush();
      if (reqContentLength != -1) {
        copyFully(cltStream.in, svrStream.out, reqContentLength);
      }
      svrStream.out.flush();
    }

    protected void doResponse(final HttpContext context) throws Exception {

      responseHeader = HttpHeader.readFrom(svrStream.in);

      {
        final int i1 = responseHeader.getStartLine().indexOf('\u0020');
        final int i2 = responseHeader.getStartLine().indexOf('\u0020', i1 + 1);
        if (i1 == -1 || i2 == -1) {
          console.error("bad res start line:" + responseHeader.getStartLine() );
        }
        responseHeader.setAttribute("version",
            responseHeader.getStartLine().substring(0, i1) );
        responseHeader.setAttribute("status",
            Integer.valueOf(responseHeader.getStartLine().substring(i1 + 1, i2) ) );
      }

      context.getEventTarget().trigger("beforeresponse",
          map("responseHeader", responseHeader) );

      console.log(responseHeader.getStartLine() );
      console.log(responseHeader.getHeadersAsString() );

      responseHeader.setHeader(Constants.PROXY_CONNECTION, "close");

      int resContentLength = -1;
      boolean chunked = false;

      try {
        cltStream.out.println(responseHeader.getStartLine() );
        for (final String key : responseHeader.getHeaderNames() ) {
          final String lcKey = key.toLowerCase();
          for (final String value : responseHeader.getHeaderValues(key) ) {
            if (lcKey.equals(Constants.CONTENT_LENGTH) ) {
              resContentLength = Integer.parseInt(value);
            } else if (lcKey.equals(Constants.TRANSFER_ENCODING) ) {
              chunked = value.equals(Constants.CHUNKED);
            }
            cltStream.out.println(key + ": " + value);
          }
        }
        cltStream.out.println();
        cltStream.out.flush();
      } catch(SocketException e) {
        // ignore
        console.log("response aborted.");
        return;
      }

      int contentLength = 0;
      if (resContentLength != -1) {
        contentLength += copyFully(
            svrStream.in, cltStream.out, resContentLength);
      } else if (chunked) {
        while (true) {
          final String chunk = svrStream.in.readLine();
          final int chunkSize = Integer.parseInt(chunk, 16);
          cltStream.out.println(chunk);
          contentLength += copyFully(svrStream.in, cltStream.out, chunkSize);
          cltStream.out.println(svrStream.in.readLine() );
          cltStream.out.flush();
          if (chunkSize == 0) {
            break;
          }
        }
      } else {
        contentLength += copyFully(svrStream.in, cltStream.out);
      }
      cltStream.out.flush();

      final long time = System.currentTimeMillis() - startTime;
      final StringBuilder buf = new StringBuilder();
      buf.append("done");
      buf.append("/content-length: ");
      buf.append(contentLength);
      buf.append("/");
      buf.append(time);
      buf.append("ms");
      console.log(buf.toString() );
    }
  }

  public static class HttpSession implements Runnable {

    private static final Pattern STR_PAT = Pattern.compile("\\u0020");

    private final HttpContext context;
    private final Socket cltSocket;

    public HttpSession(final HttpContext context, final Socket cltSocket) {
      this.context = context;
      this.cltSocket = cltSocket;
    }

    protected void doSession() throws Exception {
      try {

        final HttpStream cltStream = context.createStream(cltSocket);
        final HttpHeader requestHeader = HttpHeader.readFrom(cltStream.in);
        console.log(requestHeader.getStartLine() );
        console.log(requestHeader.getHeadersAsString() );

        final String[] reqTokens = STR_PAT.split(requestHeader.getStartLine() );
        if (reqTokens.length != 3) {
          throw new IOException("bad req start line:" + requestHeader.getStartLine() );
        }
        final String method = reqTokens[0];
        final String path = reqTokens[1];
        final String version = reqTokens[2];

        requestHeader.setAttribute("method", method);
        requestHeader.setAttribute("path", path);
        requestHeader.setAttribute("version", version);

        if (method.equalsIgnoreCase("CONNECT") ) {

          int index = path.indexOf(':');
          if (index == -1) {
            console.error("bad request:" + path);
            return;
          }
          final String host = path.substring(0, index);
          final int port = Integer.parseInt(path.substring(index + 1) );
          final String proxy = context.getProxy(host);

          if (HttpContext.DIRECT.equals(proxy) ) {

            final ConnectorHandler handler = new ConnectorHandler();
            handler.setTargetHost(host);
            handler.setTargetPort(port);
            handler.setTargetProxy(false);
            handler.handle(context, cltStream, requestHeader);

          } else if (proxy != null) {

            final ConnectorHandler handler = new ConnectorHandler();
            setTarget(handler, proxy);
            handler.setTargetProxy(true);
            handler.handle(context, cltStream, requestHeader);

          } else {
            console.error("bad host:" + host);
          }

        } else {

          final URL url = new URL(path);
          final String proxy = context.getProxy(url.getHost() );

          if (HttpContext.DIRECT.equals(proxy) ) {

            // rewrite start line.
            requestHeader.setStartLine(method + " " +
                url.getFile() + " " + version);
            final ProxyHandler handler = new ProxyHandler();
            handler.setTargetHost(url.getHost() );
            handler.setTargetPort(url.getPort() != -1? url.getPort(): 80);
            handler.setTargetProxy(false);
            handler.handle(context, cltStream, requestHeader);

          } else if (proxy != null) {

            final ProxyHandler handler = new ProxyHandler();
            setTarget(handler, proxy);
            handler.setTargetProxy(true);
            handler.handle(context, cltStream, requestHeader);

          } else {
            console.error("bad host:" + url.getHost() );
          }
        }

      } finally {
        cltSocket.close();
      }
    }

    protected static void setTarget(
        final AbstractProxyHandler handler, final String proxy) {
      final int index = proxy.indexOf(':');
      final String host = index != -1? proxy.substring(0, index) : proxy;
      final int port = index != -1?
          Integer.parseInt(proxy.substring(index + 1) ) : 8080;
      handler.setTargetHost(host);
      handler.setTargetPort(port);
    }

    @Override
    public void run() {
      try {
        doSession();
      } catch(RuntimeException e) {
        throw e;
      } catch(SocketException e) {
        console.error(e);
      } catch(EOFException e) {
        console.error(e);
      } catch(Exception e) {
        throw new RuntimeException(e);
      }
    }
  }

  protected static class HttpHeader {
    private static final String[] EMPTY_VALUES = new String[0];
    private static final String START_LINE = "startLine";
    private static final String HEADERS = "headers";
    private Map<String, Object> attrs =
        new LinkedHashMap<String, Object>();
    public HttpHeader() {
    }
    @Override
    public String toString() {
      return attrs.toString();
    }
    public void setAttribute(final String name, final Object value) {
      attrs.put(name, value);
    }
    public Object getAttribute(final String name) {
      return attrs.get(name);
    }
    public String getStartLine() {
      return (String)getAttribute(START_LINE);
    }
    public void setStartLine(String startLine) {
      setAttribute(START_LINE, startLine);
    }
    protected static class Key {
      private final String key;
      private final String lcKey;
      private Key(final String key) {
        this.key = key.intern();
        this.lcKey = key.toLowerCase().intern();
      }
      public String getOriginalKey() {
        return key;
      }
      @Override
      public int hashCode() {
        return lcKey.hashCode();
      }
      @Override
      public boolean equals(final Object obj) {
        if (obj == null) {
          return false;
        } else if (obj instanceof Key) {
          return ((Key)obj).lcKey.equals(lcKey);
        }
        throw new IllegalArgumentException(obj.toString() );
      }
      @Override
      public String toString() {
        return key;
      }
      public static Key valueOf(String key) {
        return new Key(key);
      }
    }
    protected Map<Key, List<String>> getHeaders() {
      @SuppressWarnings("unchecked")
      Map<Key, List<String>> headers =
        (Map<Key, List<String>>)getAttribute(HEADERS);
      if (headers == null) {
        headers = new LinkedHashMap<Key, List<String>>();
        setAttribute(HEADERS, headers);
      }
      return headers;
    }
    public Iterable<String> getHeaderNames() {
      final List<String> keys = new ArrayList<String>();
      for (Key key : getHeaders().keySet() ) {
        keys.add(key.getOriginalKey() );
      }
      return keys;
    }
    public String[] getHeaderValues(final String name) {
      final List<String> values = getHeaders().get(Key.valueOf(name) );
      return values != null?
          values.toArray(new String[values.size()]) : EMPTY_VALUES;
    }
    public String getHeader(final String name) {
      final String[] values = getHeaderValues(name);
      return values.length > 0? values[0] : null;
    }
    public void addHeader(final String name, final String value) {
      final Key key = Key.valueOf(name);
      List<String> values = getHeaders().get(key);
      if (values == null) {
        values = new ArrayList<String>(1);
        getHeaders().put(key, values);
      }
      values.add(value);
    }
    public void removeHeader(final String name) {
      getHeaders().remove(Key.valueOf(name) );
    }
    public String getHeadersAsString() {
      return getHeaders().toString();
    }
    public void setHeader(final String name, final String value) {
      removeHeader(name);
      addHeader(name, value);
    }
    public static HttpHeader readFrom(PlainInputStream in)
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
        header.addHeader(k, v);
      }
      return header;
    }
  }

  public static class HttpStream {
    public final PlainInputStream in;
    public final PlainOutputStream out;
    public HttpStream(final ByteInput in, final ByteOutput out) {
      this.in = new PlainInputStream(in);
      this.out = new PlainOutputStream(out);
    }
  }

  protected interface Constants {
    String CONTENT_LENGTH = "content-length";
    String TRANSFER_ENCODING = "transfer-encoding";
    String CHUNKED = "chunked";
    String PROXY_CONNECTION = "proxy-connection";
    String US_ASCII = "ISO-8859-1";
    int CR = '\r';
    int LF = '\n';
  }

  protected interface ByteInput {
    int read() throws IOException;
  }

  protected interface ByteOutput {
    void write(int b) throws IOException;
    void flush() throws IOException;
  }

  protected static class PlainInputStream implements ByteInput {
    private final ByteInput in;
    public PlainInputStream(final ByteInput in) {
      this.in = in;
    }
    @Override
    public int read() throws IOException {
      return in.read();
    }
    public String readLine() throws IOException {
      final ByteArrayOutputStream bout = new ByteArrayOutputStream();
      try {
        int b;
        while ( (b = read() ) != -1) {
          if (b == Constants.CR) {
            b = in.read();
            if (b != Constants.LF) {
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
      return new String(bout.toByteArray(), Constants.US_ASCII);
    }
  }

  protected static class PlainOutputStream implements ByteOutput {
    private final ByteOutput out;
    public PlainOutputStream(final ByteOutput out) {
      this.out = out;
    }
    public void print(final String line) throws IOException {
      for (byte b : line.getBytes(Constants.US_ASCII) ) {
        write(b);
      }
    }
    public void println() throws IOException {
      write(Constants.CR);
      write(Constants.LF);
    }
    public void println(final String line) throws IOException {
      print(line);
      println();
    }
    @Override
    public void write(int b) throws IOException {
      out.write(b);
    }
    @Override
    public void flush() throws IOException {
      out.flush();
    }
  }

  public static int copyFully(
      final ByteInput in,
      final ByteOutput out, final int length) throws IOException {
    int readLen = 0;
    while (readLen < length) {
      final int b = in.read();
      if (b == -1) {
        throw new EOFException("unexpected end of file.");
      }
      out.write(b);
      readLen += 1;
    }
    return readLen;
  }

  public static int copyFully(
      final ByteInput in,
      final ByteOutput out) throws IOException {
    int readLen = 0;
    while (true) {
      final int b = in.read();
      if (b == -1) {
        break;
      }
      out.write(b);
      readLen += 1;
    }
    return readLen;
  }

  public static class EventTarget {
    private final Map<String,List<EventListener>> map =
        new HashMap<String, List<EventListener>>();
    public EventTarget() {
    }
    protected List<EventListener> getListeners(final String type) {
      List<EventListener> listeners = map.get(type);
      if (listeners == null) {
        listeners = new ArrayList<HttpProxy.EventListener>(1);
        map.put(type, listeners);
      }
      return listeners;
    }
    public EventTarget trigger(final String type, final Object detail)
    throws Exception {
      final EventObject e = new EventObject(type, this, detail);
      for (EventListener l : getListeners(type) ) {
        l.handle(e);
      }
      return this;
    }
    public EventTarget on(final String type, final EventListener l) {
      getListeners(type).add(l);
      return this;
    }
    public EventTarget off(final String type, final EventListener l) {
      getListeners(type).remove(l);
      return this;
    }
  }

  public static class EventObject {
    private final String type;
    private final Object target;
    private final Object detail;
    private boolean defaultPrevented;
    public EventObject(final String type,
        final Object target, final Object detail) {
      this.type = type;
      this.target = target;
      this.detail = detail;
      this.defaultPrevented = false;
    }
    public String getType() {
      return type;
    }
    public Object getTarget() {
      return target;
    }
    public Object getDetail() {
      return detail;
    }
    public void preventDefault() {
      defaultPrevented = true;
    }
    public boolean isDefaultPrevented() {
      return defaultPrevented;
    }
    @Override
    public String toString() {
      final StringBuilder buf = new StringBuilder();
      buf.append(getClass().getSimpleName() );
      buf.append('(');
      buf.append("type=");
      buf.append(getType() );
      buf.append(",target=");
      buf.append(getTarget() );
      buf.append(",detail=");
      buf.append(getDetail() );
      buf.append(",defaultPrevented=");
      buf.append(isDefaultPrevented() );
      buf.append(')');
      return buf.toString();
    }
  }

  public interface EventListener {
    void handle(EventObject e) throws Exception;
  }

  protected static final Map<?,?> map(final Object... o) {
    final Map<Object,Object> map = new LinkedHashMap<Object, Object>();
    for (int i = 0; i < o.length; i += 2) {
      map.put(o[i], o[i + 1]);
    }
    return map;
  }

  protected static final Console console = new Console() {
    @Override
    public void log(final String msg) {
      out("INFO ", msg);
    }
    @Override
    public void error(final String msg) {
      out("ERROR", msg);
    }
    public void error(final Throwable t) {
      error(t.getMessage() );
      t.printStackTrace(System.out);
    }
    protected void out(final String level, final Object msg) {
      final String timestamp =
          new SimpleDateFormat("yyyy/MM/dd HH:mm:ss.SSS").format(new Date() );
      System.out.println(timestamp + " " + level +
          " " + Thread.currentThread().getName() +  " - " + msg);
    }
  };

  protected interface Console {
    void log(String msg);
    void error(String msg);
    void error(Throwable t);
  }
}
