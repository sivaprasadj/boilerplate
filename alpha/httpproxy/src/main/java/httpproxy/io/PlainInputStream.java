package httpproxy.io;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

public class PlainInputStream implements ByteInput {
  private final ByteInput in;
  public PlainInputStream(final ByteInput in) {
    this.in = in;
  }
  @Override
  public int read() throws IOException {
    return in.read();
  }
  @Override
  public int read(final byte[] buf) throws IOException {
    return in.read(buf);
  }
  public String readLine() throws IOException {
    final ByteArrayOutputStream bout = new ByteArrayOutputStream();
    try {
      int b;
      while ( (b = read() ) != -1) {
        if (b == PlainConstants.CR) {
          b = in.read();
          if (b != PlainConstants.LF) {
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
    return new String(bout.toByteArray(), PlainConstants.US_ASCII);
  }
  @Override
  public boolean isShutdown() throws IOException {
    return in.isShutdown();
  }
}
