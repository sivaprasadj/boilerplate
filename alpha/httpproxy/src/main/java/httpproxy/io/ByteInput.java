package httpproxy.io;

import java.io.IOException;

public interface ByteInput {
  int read() throws IOException;
  int read(byte[] buf) throws IOException;
  boolean isShutdown() throws IOException;
}
