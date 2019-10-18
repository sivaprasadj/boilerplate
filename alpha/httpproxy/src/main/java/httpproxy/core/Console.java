package httpproxy.core;

import java.util.logging.Level;
import java.util.logging.Logger;

public interface Console {
  void log(String msg);
  void error(String msg);
  void error(Throwable t);
  Console global = new Console() {
    private final Logger logger = Logger.getLogger("httpproxy");
    @Override
    public void log(final String msg) {
      logger.info(msg);
    }
    @Override
    public void error(final String msg) {
      logger.severe(msg);
    }
    @Override
    public void error(final Throwable t) {
      logger.log(Level.SEVERE, t.getMessage(), t);
    }
  };
}
