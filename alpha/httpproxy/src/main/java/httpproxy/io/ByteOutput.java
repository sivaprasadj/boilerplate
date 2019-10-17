package httpproxy.io;

import java.io.IOException;

public interface ByteOutput {
  void write(int b) throws IOException;
  void flush() throws IOException;
}
