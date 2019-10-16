package httpproxy.event;


public interface EventListener {
  void handle(EventObject e) throws Exception;
}
