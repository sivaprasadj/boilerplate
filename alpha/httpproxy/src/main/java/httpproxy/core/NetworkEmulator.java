package httpproxy.core;

import java.io.IOException;
import java.text.DecimalFormat;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

import httpproxy.io.ByteInput;
import httpproxy.io.ByteOutput;

public class NetworkEmulator {
  protected static final Console console = Console.global;
  private static final long FEED_INTERVAL_IN_MILLIS = 50L;
  private final Object lock = new Object();
  private Executor es;
  private long bps = 0;
  private long bufInBits = 0;
  public NetworkEmulator() {
  }
  public long getBps() {
    return bps;
  }
  public void setBps(long bps) {
    final DecimalFormat fmt = new DecimalFormat("###,###,###,###,##0");
    console.log("network speed: " + fmt.format(bps / 8) +
        "[bytes per second] (" +
        fmt.format(bps / 1024 / 1024) + "Mbps)");
    this.bps = bps;
  }
  public void start() {
    es = Executors.newSingleThreadExecutor(new ThreadFactory() {
      @Override
      public Thread newThread(final Runnable r) {
        final Thread t = new Thread(r);
        t.setName("network-feeder");
        return t;
      }
    });
    es.execute(new Runnable() {
      @Override
      public void run() {
        try {
          doTimer();
        } catch(RuntimeException e) {
          throw e;
        } catch(Exception e) {
          throw new RuntimeException(e);
        }
      }
    });
    console.log("network emulator started.");
  }
  protected void doTimer() throws Exception {
    long lastTime = System.currentTimeMillis();
    while (true) {
      synchronized(lock) {
        final long time = System.currentTimeMillis();
        final long feed = bps * (time - lastTime) / 1000;
        bufInBits = feed;
        lastTime = time;
        lock.notifyAll();
      }
      Thread.sleep(FEED_INTERVAL_IN_MILLIS);
    }
  }
  protected void consume() {
    synchronized(lock) {
      try {
        while (bufInBits < 8) {
          lock.wait();
        }
      } catch(InterruptedException e) {
        throw new RuntimeException(e);
      }
      bufInBits -= 8;
    }
  }
  public ByteInput wrap(final ByteInput in) {
    return new ByteInput() {
      @Override
      public int read() throws IOException {
        consume();
        return in.read();
      }
    };
  }
  public ByteOutput wrap(final ByteOutput out) {
    return new ByteOutput() {
      @Override
      public void write(final int b) throws IOException {
        consume();
        out.write(b);
      }
      @Override
      public void flush() throws IOException {
        out.flush();
      }
    };
  }
}
