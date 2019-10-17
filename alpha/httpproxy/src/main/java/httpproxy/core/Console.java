package httpproxy.core;

public interface Console {
  void log(String msg);
  void error(String msg);
  void error(Throwable t);
}
