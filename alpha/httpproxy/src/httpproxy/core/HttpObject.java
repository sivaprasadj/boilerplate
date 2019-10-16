package httpproxy.core;

import java.text.SimpleDateFormat;
import java.util.Date;

public class HttpObject {
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
}
