package httpproxy.core;

import java.io.File;

public class Main {
  private static final String LOGGING_FILE = "java.util.logging.config.file";
  public static void main(final String[] args) throws Exception {
    if (System.getProperty(LOGGING_FILE) == null) {
      final File loggingFile = new File("logging.properties");
      if (loggingFile.exists() ) {
        System.setProperty(LOGGING_FILE, loggingFile.getName() );
      }
    }
    new HttpProxy().start();
  }
}
