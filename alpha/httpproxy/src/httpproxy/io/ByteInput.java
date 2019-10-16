package httpproxy.io;

import java.io.IOException;

public interface ByteInput {
  int read() throws IOException;
}
