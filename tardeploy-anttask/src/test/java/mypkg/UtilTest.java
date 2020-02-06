package mypkg;

import org.junit.Assert;
import org.junit.Test;

public class UtilTest {

  @Test
  public void splitInfo() throws Exception {
    String[] info = Util.splitInfo("a:b:c:d");
    Assert.assertEquals(4, info.length);
    Assert.assertEquals("a", info[0]);
    Assert.assertEquals("d", info[3]);
  }

  @Test
  public void patternMatches() throws Exception {
    Assert.assertTrue(Util.patternMatches("a", "a") );
    Assert.assertTrue(Util.patternMatches("*.txt", "test.txt") );
    Assert.assertTrue(Util.patternMatches("*.txt", "test2.txt") );
    Assert.assertTrue(Util.patternMatches("*.txt", "testtxt") );
  }
}
