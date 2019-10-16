package httpproxy.io;

import java.io.EOFException;
import java.io.IOException;

public class IOUtil {

  private IOUtil() {
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
}
