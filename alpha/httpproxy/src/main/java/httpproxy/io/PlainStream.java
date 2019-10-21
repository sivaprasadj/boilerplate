package httpproxy.io;

/**
 * PlainStream
 * @author kazuhiko arase
 */
public class PlainStream {
  public final PlainInputStream in;
  public final PlainOutputStream out;
  public PlainStream(final ByteInput in, final ByteOutput out) {
    this.in = new PlainInputStream(in);
    this.out = new PlainOutputStream(out);
  }
}
