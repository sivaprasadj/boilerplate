package httpproxy.core;

import java.util.logging.Level;
import java.util.logging.Logger;

public class HttpObject {
  private static final Logger logger = Logger.getLogger("httpproxy");
  protected static final Console console = new Console() {
    @Override
    public void log(final String msg) {
      logger.info(msg);
    }
    @Override
    public void error(final String msg) {
      logger.severe(msg);
    }
    public void error(final Throwable t) {
      logger.log(Level.SEVERE, t.getMessage(), t);
    }
  };
}
