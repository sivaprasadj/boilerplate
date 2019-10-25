package httpproxy.core;

import java.util.LinkedHashMap;
import java.util.Map;

import javax.swing.JOptionPane;
import javax.swing.SwingUtilities;

/**
 * Util
 * @author kazuhiko arase
 */
public class Util {

  private Util() {
  }

  public static final Map<?,?> map(final Object... o) {
    final Map<Object,Object> map = new LinkedHashMap<Object, Object>();
    for (int i = 0; i < o.length; i += 2) {
      map.put(o[i], o[i + 1]);
    }
    return map;
  }

  private static final String TITLE = "httpproxy";

  public static void alert(final String message) throws Exception {
    SwingUtilities.invokeAndWait(new Runnable() {
      @Override
      public void run() {
        JOptionPane.showMessageDialog(null, message, TITLE,
            JOptionPane.INFORMATION_MESSAGE);
      }
    });
  }

  public static boolean confirm(final String message) throws Exception {
    final int[] ret = { 0 };
    SwingUtilities.invokeAndWait(new Runnable() {
      @Override
      public void run() {
        ret[0] = JOptionPane.showConfirmDialog(null, message, TITLE,
            JOptionPane.YES_NO_OPTION, JOptionPane.QUESTION_MESSAGE);
      }
    });
    return ret[0] == JOptionPane.YES_OPTION;
  }

  public static String input(final String message) throws Exception {
    final String[] input = { null };
    SwingUtilities.invokeAndWait(new Runnable() {
      @Override
      public void run() {
        input[0] = JOptionPane.showInputDialog(null, message,
            TITLE, JOptionPane.QUESTION_MESSAGE);
      }
    });
    return input[0];
  }
}
