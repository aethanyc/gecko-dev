/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

add_task(async function test_translated_div_element_and_visible_change() {
  let hasVisibleChangeOccurred = false;
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
    <div>
      This is a simple translation.
    </div>
  `,
    {
      mockedTranslatorPort: createMockedTranslatorPort(),
      mockedReportVisibleChange: () => {
        hasVisibleChangeOccurred = true;
      },
    }
  );

  translate();

  await htmlMatches(
    "A single element with a single text node is translated into uppercase.",
    /* html */ `
      <div>
        THIS IS A SIMPLE TRANSLATION.
      </div>
    `
  );

  Assert.ok(hasVisibleChangeOccurred, "A visible change was reported.");
  cleanup();
});

add_task(async function test_translated_textnode() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    "This is a simple text translation."
  );

  translate();

  await htmlMatches(
    "A Text node at the root is translated into all caps",
    "THIS IS A SIMPLE TEXT TRANSLATION."
  );

  cleanup();
});

add_task(async function test_no_text_trees() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      <div></div>
      <span></span>
    </div>
  `);

  translate();

  await htmlMatches(
    "Trees with no text are not affected",
    /* html */ `
      <div>
        <div></div>
        <span></span>
      </div>
    `
  );

  cleanup();
});

add_task(async function test_no_text_trees() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc("");
  translate();
  await htmlMatches("No text is still no text", "");
  cleanup();
});

add_task(async function test_translated_title() {
  const { cleanup, document, translate } =
    await createTranslationsDoc(/* html */ `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>This is an actual full page.</title>
    </head>
    <body>

    </body>
    </html>
  `);

  translate();

  const translatedTitle = "THIS IS AN ACTUAL FULL PAGE.";
  await waitForCondition(() => document.title === translatedTitle);

  cleanup();
});

add_task(async function test_translated_nested_elements() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div class="menu-main-menu-container">
      <ul class="menu-list">
        <li class="menu-item menu-item-top-level">
          <a href="/">Latest Work</a>
        </li>
        <li class="menu-item menu-item-top-level">
          <a href="/category/interactive/">Creative Coding</a>
        </li>
        <li id="menu-id-categories" class="menu-item menu-item-top-level">
          <a href="#"><span class='category-arrow'>Categories</span></a>
        </li>
      </ul>
    </div>
  `);

  translate();

  await htmlMatches(
    "The nested elements are translated into all caps.",
    /* html */ `
      <div class="menu-main-menu-container">
        <ul class="menu-list">
          <li class="menu-item menu-item-top-level">
            <a href="/">
              LATEST WORK
            </a>
          </li>
          <li class="menu-item menu-item-top-level">
            <a href="/category/interactive/">
              CREATIVE CODING
            </a>
          </li>
          <li id="menu-id-categories" class="menu-item menu-item-top-level">
            <a href="#">
              <span class="category-arrow">
                CATEGORIES
              </span>
            </a>
          </li>
        </ul>
      </div>
    `
  );

  cleanup();
});

/**
 * Only translate elements with a matching "from" language.
 */
add_task(async function test_translated_language() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      <div>
        No lang property
      </div>
      <div lang="en">
        Language matches
      </div>
      <div lang="fr">
        Language mismatch is ignored.
      </div>
      <div lang="en-US">
        Language match with region.
      </div>
      <div lang="fr">
        <div>
          Language mismatch with
        </div>
        <div>
          nested elements.
        </div>
      </div>
    </div>
  `);

  translate();

  await htmlMatches(
    "Language matching of elements behaves as expected.",
    /* html */ `
    <div>
      <div>
        NO LANG PROPERTY
      </div>
      <div lang="en">
        LANGUAGE MATCHES
      </div>
      <div lang="fr">
        Language mismatch is ignored.
      </div>
      <div lang="en-US">
        LANGUAGE MATCH WITH REGION.
      </div>
      <div lang="fr">
        <div>
          Language mismatch with
        </div>
        <div>
          nested elements.
        </div>
      </div>
    </div>
    `
  );

  cleanup();
});

/**
 * Test elements that have been marked as ignored.
 */
add_task(async function test_ignored_translations() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div translate="yes">
      This is translated.
    </div>
    <div translate="no">
      This is not translated.
    </div>
    <div class="notranslate">
      This is not translated.
    </div>
    <div class="class-before notranslate class-after">
      This is not translated.
    </div>
    <div contenteditable>
      This is not translated.
    </div>
    <div contenteditable="true">
      This is not translated.
    </div>
    <div contenteditable="false">
      This is translated.
    </div>
  `);

  translate();

  await htmlMatches(
    "Language matching of elements behaves as expected.",
    /* html */ `
    <div translate="yes">
      THIS IS TRANSLATED.
    </div>
    <div translate="no">
      This is not translated.
    </div>
    <div class="notranslate">
      This is not translated.
    </div>
    <div class="class-before notranslate class-after">
      This is not translated.
    </div>
    <div contenteditable="">
      This is not translated.
    </div>
    <div contenteditable="true">
      This is not translated.
    </div>
    <div contenteditable="false">
      THIS IS TRANSLATED.
    </div>
    `
  );

  cleanup();
});

/**
 * Test excluded tags.
 */
add_task(async function test_excluded_tags() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      This is translated.
    </div>
    <code>
      This is ignored
    </code>
    <script>
      This is ignored
    </script>
    <textarea>
      This is ignored
    </textarea>
  `);

  translate();

  await htmlMatches(
    "EXCLUDED_TAGS are not translated",
    /* html */ `
    <div>
      THIS IS TRANSLATED.
    </div>
    <code>
      This is ignored
    </code>
    <script>
      This is ignored
    </script>
    <textarea>
      This is ignored
    </textarea>
    `
  );

  cleanup();
});

add_task(async function test_comments() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <!-- Comments don't make it to the DOM -->
    <div>
      <!-- These will be ignored in the translation. -->
      This is translated.
    </div>
  `);

  translate();

  await htmlMatches(
    "Comments do not affect things.",
    /* html */ `
    <div>
      <!-- These will be ignored in the translation. -->
      THIS IS TRANSLATED.
    </div>
    `
  );

  cleanup();
});

/**
 * Test the batching behavior on what is sent in for a translation.
 */
add_task(async function test_translation_batching() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <div>
        This is a simple section.
      </div>
      <div>
        <span>This entire</span> section continues in a <b>batch</b>.
      </div>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "Batching",
    /* html */ `
    <div>
      aaaa aa a aaaaaa aaaaaaa.
    </div>
    <div>
      <span>
        bbbb bbbbbb
      </span>
      bbbbbbb bbbbbbbbb bb b
      <b>
        bbbbb
      </b>
      .
    </div>
    `
  );

  cleanup();
});

/**
 * Test the inline/block behavior on what is sent in for a translation.
 */
add_task(async function test_translation_inline_styling() {
  const { document, translate, htmlMatches, cleanup } =
    await createTranslationsDoc(
      /* html */ `
      Bare text is sent in a batch.
      <span>
        Inline text is sent in a <b>batch</b>.
      </span>
      <span id="spanAsBlock">
        Display "block" overrides the inline designation.
      </span>
    `,
      { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
    );

  info("Setting a span as display: block.");
  const span = document.getElementById("spanAsBlock");
  span.style.display = "block";
  is(span.ownerGlobal.getComputedStyle(span).display, "block");

  translate();

  await htmlMatches(
    "Span as a display: block",
    /* html */ `
      aaaa aaaa aa aaaa aa a aaaaa.
      <span>
        bbbbbb bbbb bb bbbb bb b
        <b>
          bbbbb
        </b>
        .
      </span>
      <span id="spanAsBlock" style="display: block;">
        ccccccc "ccccc" ccccccccc ccc cccccc ccccccccccc.
      </span>
    `
  );

  cleanup();
});

/**
 * Test what happens when there are many inline elements.
 */
add_task(async function test_many_inlines() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <div>
        <span>
          This is a
        </span>
        <span>
          much longer
        </span>
        <span>
          section that includes
        </span>
        <span>
          many span elements
        </span>
        <span>
          to test what happens
        </span>
        <span>
          in cases like this.
        </span>
      </div>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "Batching",
    /* html */ `
    <div>
      <span>
        aaaa aa a
      </span>
      <span>
        aaaa aaaaaa
      </span>
      <span>
        aaaaaaa aaaa aaaaaaaa
      </span>
      <span>
        aaaa aaaa aaaaaaaa
      </span>
      <span>
        aa aaaa aaaa aaaaaaa
      </span>
      <span>
        aa aaaaa aaaa aaaa.
      </span>
    </div>
    `
  );

  cleanup();
});

/**
 * Test what happens when there are many inline elements.
 */
add_task(async function test_many_inlines() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <div>
        <div>
          This is a
        </div>
        <div>
          much longer
        </div>
        <div>
          section that includes
        </div>
        <div>
          many div elements
        </div>
        <div>
          to test what happens
        </div>
        <div>
          in cases like this.
        </div>
      </div>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "Batching",
    /* html */ `
    <div>
      <div>
        aaaa aa a
      </div>
      <div>
        bbbb bbbbbb
      </div>
      <div>
        ccccccc cccc cccccccc
      </div>
      <div>
        dddd ddd dddddddd
      </div>
      <div>
        ee eeee eeee eeeeeee
      </div>
      <div>
        ff fffff ffff ffff.
      </div>
    </div>
    `
  );

  cleanup();
});

/**
 * Test a mix of inline text and block elements.
 */
add_task(async function test_presumed_inlines1() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <div>
        Text node
        <div>Block element</div>
      </div>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "Mixing a text node with block elements will send in two batches.",
    /* html */ `
    <div>
      aaaa aaaa
      <div>
        bbbbb bbbbbbb
      </div>
    </div>
    `
  );

  cleanup();
});

/**
 * Test what happens when there are many inline elements.
 */
add_task(async function test_presumed_inlines2() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <div>
        Text node
        <span>Inline</span>
        <div>Block Element</div>
      </div>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "A mix of inline and blocks will be sent in separately.",
    /* html */ `
    <div>
      aaaa aaaa
      <span>
        bbbbbb
      </span>
      <div>
        ccccc ccccccc
      </div>
    </div>
    `
  );

  cleanup();
});

add_task(async function test_presumed_inlines3() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <div>
        Text node
        <span>Inline</span>
        <div>Block Element</div>
        <div>Block Element</div>
        <div>Block Element</div>
      </span>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "Conflicting inlines will be sent in as separate blocks if there are more block elements",
    /* html */ `
    <div>
      aaaa aaaa
      <span>
        bbbbbb
      </span>
      <div>
        ccccc ccccccc
      </div>
      <div>
        ddddd ddddddd
      </div>
      <div>
        eeeee eeeeeee
      </div>
    </div>
    `
  );

  cleanup();
});

/**
 * Test the display "none" properties properly subdivide in block elements.
 */
add_task(async function test_display_none() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <p>
        This is some text.
        <span>It has inline elements</span>
        <style></style>
      </p>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  // Note: The bergamot translator does not translate style elements, while our fake
  // translator does translate the inside of style elements. That is why in the assertion
  // here the style element is blank rather than containing style.
  await htmlMatches(
    "Display none",
    /* html */ `
    <p>
      aaaa aa aaaa aaaa.
      <span>
        aa aaa aaaaaa aaaaaaaa
      </span>
      <style>
      </style>
    </p>
    `
  );

  cleanup();
});

/**
 * Test the display "none" properties properly subdivide in block elements.
 *
 * TODO - See Bug 1885235
 *
 * This assertion is wrong, as our test suite doesn't properly compute the style for
 * elements. The div with "display; none;" is still block, not "none".
 */
add_task(async function test_display_none_div() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <div>
        <span>
          Start of inline text
        </span>
        <div style="display: none;">
          hidden portion of
        </div>
        <span>
          rest of inline text.
        </span>
      </div>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  // eslint-disable-next-line no-unused-vars
  const _realExpectedResults = /* html */ `
    <div>
      <span>
        aaaaa aa aaaaaa aaaa
      </span>
      <div style="display: none;">
        aaaaaa aaaaaaa aa
      </div>
      <span>
        aaaa aa aaaaaa aaaa.
      </span>
    </div>
  `;

  const currentResults = /* html */ `
    <div>
      <span>
        aaaaa aa aaaaaa aaaa
      </span>
      <div style="display: none;">
        bbbbbb bbbbbbb bb
      </div>
      <span>
        cccc cc cccccc cccc.
      </span>
    </div>
  `;

  await htmlMatches("Display none", currentResults);

  cleanup();
});

add_task(async function test_chunking_large_text() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <pre>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque fermentum est ante, ut porttitor enim molestie et. Nam mattis ullamcorper justo a ultrices. Ut ac sodales lorem. Sed feugiat ultricies lacus. Proin dapibus sit amet nunc a ullamcorper. Donec leo purus, convallis quis urna non, semper pulvinar augue. Nulla placerat turpis arcu, sit amet imperdiet sapien tincidunt ut. Donec sit amet luctus lorem, sed consectetur lectus. Pellentesque est nisi, feugiat et ipsum quis, vestibulum blandit nulla.

        Proin accumsan sapien ut nibh mattis tincidunt. Donec facilisis nibh sodales, mattis risus et, malesuada lorem. Nam suscipit lacinia venenatis. Praesent ac consectetur ante. Vestibulum pulvinar ut massa in viverra. Nunc tincidunt tortor nunc. Vivamus sit amet hendrerit mi. Aliquam posuere velit non ante facilisis euismod. In ullamcorper, lacus vel hendrerit tincidunt, dui justo iaculis nulla, sit amet tincidunt nisl magna et urna. Sed varius tincidunt ligula. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nam sed gravida ligula. Donec tincidunt arcu eros, ac maximus magna auctor eu. Vivamus suscipit neque velit, in ullamcorper elit pulvinar et. Morbi auctor tempor risus, imperdiet placerat velit gravida vel. Duis ultricies accumsan libero quis molestie.

        Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam nec arcu dapibus enim vulputate vulputate aliquet a libero. Nam hendrerit pulvinar libero, eget posuere quam porta eu. Pellentesque dignissim justo eu leo accumsan, sit amet suscipit ante gravida. Vivamus eu faucibus orci. Quisque sagittis tortor eget orci venenatis porttitor. Quisque mollis ipsum a dignissim dignissim.

        Aenean sagittis nisi lectus, non lacinia orci dapibus viverra. Donec diam lorem, tincidunt sed massa vel, vulputate tincidunt metus. In quam felis, egestas et faucibus faucibus, vestibulum quis tortor. Morbi odio mi, suscipit vitae leo in, consequat interdum augue. Quisque purus velit, dictum ac ante eget, volutpat dapibus ante. Suspendisse quis augue vitae velit elementum dictum nec aliquet nisl. Maecenas vestibulum quam augue, eu maximus urna blandit eu. Donec nunc risus, elementum id ligula nec, ultrices venenatis libero. Suspendisse ullamcorper ex ante, malesuada pulvinar sem placerat vel.

        In hac habitasse platea dictumst. Duis vulputate tellus arcu, at posuere ligula viverra luctus. Fusce ultrices malesuada neque vitae vehicula. Aliquam blandit nisi sed nibh facilisis, non varius turpis venenatis. Vestibulum ut velit laoreet, sagittis leo ac, pharetra ex. Aenean mollis risus sed nibh auctor, et feugiat neque iaculis. Fusce fermentum libero metus, at consectetur massa euismod sed. Mauris ut metus sit amet leo porttitor mollis. Vivamus tincidunt lorem non purus suscipit sollicitudin. Maecenas ut tristique elit. Ut eu volutpat turpis. Suspendisse nec tristique augue. Nullam faucibus egestas volutpat. Sed tempor eros et mi ultrices, nec feugiat eros egestas.
      </pre>
    `,
    { mockedTranslatorPort: createBatchedMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "Large chunks of text can be still sent in for translation in one big pass, " +
      "this could be slow bad behavior for the user.",
    /* html */ `
    <pre>
        aaaaa aaaaa aaaaa aaa aaaa, aaaaaaaaaaa aaaaaaaaaa aaaa. aaaaaaa aaaaaaaaa aaa aaaa, aa aaaaaaaaa aaaa aaaaaaaa aa. aaa aaaaaa aaaaaaaaaaa aaaaa a aaaaaaaa. aa aa aaaaaaa aaaaa. aaa aaaaaaa aaaaaaaaa aaaaa. aaaaa aaaaaaa aaa aaaa aaaa a aaaaaaaaaaa. aaaaa aaa aaaaa, aaaaaaaaa aaaa aaaa aaa, aaaaaa aaaaaaaa aaaaa. aaaaa aaaaaaaa aaaaaa aaaa, aaa aaaa aaaaaaaaa aaaaaa aaaaaaaaa aa. aaaaa aaa aaaa aaaaaa aaaaa, aaa aaaaaaaaaaa aaaaaa. aaaaaaaaaaaa aaa aaaa, aaaaaaa aa aaaaa aaaa, aaaaaaaaaa aaaaaaa aaaaa.

        aaaaa aaaaaaaa aaaaaa aa aaaa aaaaaa aaaaaaaaa. aaaaa aaaaaaaaa aaaa aaaaaaa, aaaaaa aaaaa aa, aaaaaaaaa aaaaa. aaa aaaaaaaa aaaaaaa aaaaaaaaa. aaaaaaaa aa aaaaaaaaaaa aaaa. aaaaaaaaaa aaaaaaaa aa aaaaa aa aaaaaaa. aaaa aaaaaaaaa aaaaaa aaaa. aaaaaaa aaa aaaa aaaaaaaaa aa. aaaaaaa aaaaaaa aaaaa aaa aaaa aaaaaaaaa aaaaaaa. aa aaaaaaaaaaa, aaaaa aaa aaaaaaaaa aaaaaaaaa, aaa aaaaa aaaaaaa aaaaa, aaa aaaa aaaaaaaaa aaaa aaaaa aa aaaa. aaa aaaaaa aaaaaaaaa aaaaaa. aaaaaaaa aa aaaaaaaaa aaaaa aa aaaa aaaaa aaaaaa aa aaaaaaaa. aaa aaa aaaaaaa aaaaaa. aaaaa aaaaaaaaa aaaa aaaa, aa aaaaaaa aaaaa aaaaaa aa. aaaaaaa aaaaaaaa aaaaa aaaaa, aa aaaaaaaaaaa aaaa aaaaaaaa aa. aaaaa aaaaaa aaaaaa aaaaa, aaaaaaaaa aaaaaaaa aaaaa aaaaaaa aaa. aaaa aaaaaaaaa aaaaaaaa aaaaaa aaaa aaaaaaaa.

        aaaaaaaaaa aaaa aaaaa aaaaaa aa aaaaaaaa aaaa aaaaaa aa aaaaaaaa aaaaaaa aaaaaaa aaaaa; aaaaa aaa aaaa aaaaaaa aaaa aaaaaaaaa aaaaaaaaa aaaaaaa a aaaaaa. aaa aaaaaaaaa aaaaaaaa aaaaaa, aaaa aaaaaaa aaaa aaaaa aa. aaaaaaaaaaaa aaaaaaaaa aaaaa aa aaa aaaaaaaa, aaa aaaa aaaaaaaa aaaa aaaaaaa. aaaaaaa aa aaaaaaaa aaaa. aaaaaaa aaaaaaaa aaaaaa aaaa aaaa aaaaaaaaa aaaaaaaaa. aaaaaaa aaaaaa aaaaa a aaaaaaaaa aaaaaaaaa.

        aaaaaa aaaaaaaa aaaa aaaaaa, aaa aaaaaaa aaaa aaaaaaa aaaaaaa. aaaaa aaaa aaaaa, aaaaaaaaa aaa aaaaa aaa, aaaaaaaaa aaaaaaaaa aaaaa. aa aaaa aaaaa, aaaaaaa aa aaaaaaaa aaaaaaaa, aaaaaaaaaa aaaa aaaaaa. aaaaa aaaa aa, aaaaaaaa aaaaa aaa aa, aaaaaaaaa aaaaaaaa aaaaa. aaaaaaa aaaaa aaaaa, aaaaaa aa aaaa aaaa, aaaaaaaa aaaaaaa aaaa. aaaaaaaaaaa aaaa aaaaa aaaaa aaaaa aaaaaaaaa aaaaaa aaa aaaaaaa aaaa. aaaaaaaa aaaaaaaaaa aaaa aaaaa, aa aaaaaaa aaaa aaaaaaa aa. aaaaa aaaa aaaaa, aaaaaaaaa aa aaaaaa aaa, aaaaaaaa aaaaaaaaa aaaaaa. aaaaaaaaaaa aaaaaaaaaaa aa aaaa, aaaaaaaaa aaaaaaaa aaa aaaaaaaa aaa.

        aa aaa aaaaaaaaa aaaaaa aaaaaaaa. aaaa aaaaaaaaa aaaaaa aaaa, aa aaaaaaa aaaaaa aaaaaaa aaaaaa. aaaaa aaaaaaaa aaaaaaaaa aaaaa aaaaa aaaaaaaa. aaaaaaa aaaaaaa aaaa aaa aaaa aaaaaaaaa, aaa aaaaaa aaaaaa aaaaaaaaa. aaaaaaaaaa aa aaaaa aaaaaaa, aaaaaaaa aaa aa, aaaaaaaa aa. aaaaaa aaaaaa aaaaa aaa aaaa aaaaaa, aa aaaaaaa aaaaa aaaaaaa. aaaaa aaaaaaaaa aaaaaa aaaaa, aa aaaaaaaaaaa aaaaa aaaaaaa aaa. aaaaaa aa aaaaa aaa aaaa aaa aaaaaaaaa aaaaaa. aaaaaaa aaaaaaaaa aaaaa aaa aaaaa aaaaaaaa aaaaaaaaaaaa. aaaaaaaa aa aaaaaaaaa aaaa. aa aa aaaaaaaa aaaaaa. aaaaaaaaaaa aaa aaaaaaaaa aaaaa. aaaaaa aaaaaaaa aaaaaaa aaaaaaaa. aaa aaaaaa aaaa aa aa aaaaaaaa, aaa aaaaaaa aaaa aaaaaaa.
    </pre>
    `
  );

  cleanup();
});

add_task(async function test_reordering() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      <span>
        B - This was first.
      </span>
      <span>
        A - This was second.
      </span>
      <span>
        C - This was third.
      </span>
    `,
    { mockedTranslatorPort: createdReorderingMockedTranslatorPort() }
  );

  translate();

  await htmlMatches(
    "Nodes can be re-ordered by the translator",
    /* html */ `
      <span>
        A - THIS WAS SECOND.
      </span>
      <span>
        B - THIS WAS FIRST.
      </span>
      <span>
        C - THIS WAS THIRD.
      </span>
    `
  );

  cleanup();
});

add_task(async function test_reordering2() {
  const { translate, htmlMatches, cleanup } = await createTranslationsDoc(
    /* html */ `
      B - This was first.
      <span>
        A - This was second.
      </span>
      C - This was third.
    `,
    { mockedTranslatorPort: createdReorderingMockedTranslatorPort() }
  );

  translate();

  // Note: ${"      "} is used below to ensure that the whitespace is not stripped from
  // the test.
  await htmlMatches(
    "Text nodes can be re-ordered.",
    /* html */ `
      <span>
        A - THIS WAS SECOND.
      </span>
      B - THIS WAS FIRST.
${"      "}
      C - THIS WAS THIRD.
    `
  );

  cleanup();
});

add_task(async function test_mutations() {
  const { translate, htmlMatches, cleanup, document } =
    await createTranslationsDoc(/* html */ `
    <div>
      This is a simple translation.
    </div>
  `);

  translate();

  await htmlMatches(
    "It translates.",
    /* html */ `
      <div>
        THIS IS A SIMPLE TRANSLATION.
      </div>
    `
  );

  info('Trigger the "childList" mutation.');
  const div = document.createElement("div");
  div.innerText = "This is an added node.";
  document.body.appendChild(div);

  await htmlMatches(
    "The added node gets translated.",
    /* html */ `
      <div>
        THIS IS A SIMPLE TRANSLATION.
      </div>
      <div>
        THIS IS AN ADDED NODE.
      </div>
    `
  );

  info('Trigger the "characterData" mutation.');
  document.querySelector("div").firstChild.nodeValue =
    "This is a changed node.";

  await htmlMatches(
    "The changed node gets translated",
    /* html */ `
      <div>
        THIS IS A CHANGED NODE.
      </div>
      <div>
        THIS IS AN ADDED NODE.
      </div>
    `
  );
  cleanup();
});

add_task(async function test_svgs() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      <div>Text before is translated</div>
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <style>.myText { font-family: sans-serif; }</style>
        <rect x="10" y="10" width="80" height="60" class="myRect" />
        <circle cx="150" cy="50" r="30" class="myCircle" />
        <text x="50%" y="50%" text-anchor="middle" alignment-baseline="middle" class="myText">
          Text inside of the SVG is untranslated.
        </text>
      </svg>
      <div>Text after is translated</div>
    </div>
  `);

  translate();

  await htmlMatches(
    "SVG text gets translated, and style elements are left alone.",
    /* html */ `
    <div>
      <div>
        TEXT BEFORE IS TRANSLATED
      </div>
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <style>
          .myText { font-family: sans-serif; }
        </style>
        <rect x="10" y="10" width="80" height="60" class="myRect">
        </rect>
        <circle cx="150" cy="50" r="30" class="myCircle">
        </circle>
        <text x="50%" y="50%" text-anchor="middle" alignment-baseline="middle" class="myText">
          TEXT INSIDE OF THE SVG IS UNTRANSLATED.
        </text>
      </svg>
      <div>
        TEXT AFTER IS TRANSLATED
      </div>
    </div>
    `
  );

  await cleanup();
});

add_task(async function test_svgs_more() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <foreignObject x="20" y="20" width="160" height="160">
        <div xmlns="http://www.w3.org/1999/xhtml">
          This is a div inside of an SVG.
        </div>
      </foreignObject>
    </svg>
  `);

  translate();

  await htmlMatches(
    "Foreign objects get translated",
    /* html */ `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <foreignObject x="20" y="20" width="160" height="160">
        <div xmlns="http://www.w3.org/1999/xhtml">
          THIS IS A DIV INSIDE OF AN SVG.
        </div>
      </foreignObject>
    </svg>
    `
  );

  await cleanup();
});

add_task(async function test_tables() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <table>
    <tbody>
      <tr>
        <th abbr="table_header1_abbr">Table header 1</th>
        <th abbr="table_header2_abbr">Table header 2</th>
      </tr>
      <tr>
        <td>Table data 1</td>
        <td>Table data 2</td>
      </tr>
      </tbody>
    </table>


  `);

  translate();

  await htmlMatches(
    "Tables are correctly translated.",
    /* html */ `
      <table>
        <tbody>
          <tr>
            <th abbr="TABLE_HEADER1_ABBR">
              TABLE HEADER 1
            </th>
            <th abbr="TABLE_HEADER2_ABBR">
              TABLE HEADER 2
            </th>
          </tr>
          <tr>
            <td>
              TABLE DATA 1
            </td>
            <td>
              TABLE DATA 2
            </td>
          </tr>
        </tbody>
      </table>
    `
  );

  cleanup();
});

add_task(async function test_option_values() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
      <select>
          <option>Red</option>
          <option>Orange</option>
          <option selected="">Yellow</option>
          <option value="Green">Green</option>
          <option value="Blue">Blue</option>
          <option value="Purple">Purple</option>
      </select>
  `);

  translate();

  await htmlMatches(
    "Option values are not changed",
    /* html */ `
      <select>
          <option value="Red">RED</option>
          <option value="Orange">ORANGE</option>
          <option selected="" value="Yellow">YELLOW</option>
          <option value="Green">GREEN</option>
          <option value="Blue">BLUE</option>
          <option value="Purple">PURPLE</option>
      </select>
    `
  );

  cleanup();
});

add_task(async function test_option_values() {
  const { document, translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
      <span>
        <select>
          <option>unconfirmed</option>
          <option selected="">new</option>
          <option>assigned</option>
          <option>resolved</option>
        </select>
      </span>
  `);

  const select = document.querySelector("select");

  document.querySelector("select").addEventListener("change", () => {
    ok(false, "The change event should not ever be fired.");
  });

  is(document.querySelector("select").value, "new", 'The "new" value selected');

  translate();

  await htmlMatches(
    "Option values are not changed",
    /* html */ `
      <span>
        <select>
          <option value="unconfirmed">
            UNCONFIRMED
          </option>
          <option selected="" value="new">
            NEW
          </option>
          <option value="assigned">
            ASSIGNED
          </option>
          <option value="resolved">
            RESOLVED
          </option>
        </select>
      </span>
    `
  );

  is(
    document.querySelector("select").value,
    "new",
    'After translation the "new" value is still selected'
  );

  is(
    document.querySelector("select"),
    select,
    "The original select element is still present"
  );

  cleanup();
});

add_task(async function test_basic_attributes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <label title="Titles are user visible">Enter information:</label>
    <input type="text" placeholder="This is a placeholder">
  `);

  translate();

  await htmlMatches(
    "Placeholders support added",
    /* html */ `
      <label title="TITLES ARE USER VISIBLE">
        ENTER INFORMATION:
      </label>
      <input type="text" placeholder="THIS IS A PLACEHOLDER">
    `
  );

  cleanup();
});

add_task(async function test_html_lang_attribute() {
  const { translate, document, cleanup } =
    await createTranslationsDoc(/* html */ `
    <!DOCTYPE html>
    <html lang="en" >
    <head>
      <meta charset="utf-8" />
    </head>
    <body>
    </body>
    </html>
  `);

  translate();

  await waitForCondition(() => document.documentElement.lang === "EN");

  cleanup();
});

add_task(async function test_attributes_with_innerhtml() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div title="Titles are user visible">
    Simple translation.
    </div>
  `);

  translate();

  await htmlMatches(
    "translation for title with innerHTML",
    /* html */ `
    <div title="TITLES ARE USER VISIBLE">
    SIMPLE TRANSLATION.
    </div>
    `
  );

  cleanup();
});

add_task(async function test_multiple_attributes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <input type="text" placeholder="This is a placeholder" title="Titles are user visible">
  `);

  translate();

  await htmlMatches(
    "title and placeholder together",
    /* html */ `
      <input type="text" placeholder="THIS IS A PLACEHOLDER" title="TITLES ARE USER VISIBLE">
    `
  );
  cleanup();
});

add_task(async function test_meta_content_translation() {
  const { cleanup, document, translate } =
    await createTranslationsDoc(/* html */ `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="description" content="some page description">
      <meta name="keywords" content="some page keywords">
    </head>
    <body></body>
    </html>
  `);

  translate();

  const metaDescription = document.querySelector('meta[name="description"]');
  const metaKeywords = document.querySelector('meta[name="keywords"]');

  await waitForCondition(
    () => metaDescription?.content === "SOME PAGE DESCRIPTION"
  );
  await waitForCondition(() => metaKeywords?.content === "SOME PAGE KEYWORDS");

  cleanup();
});

add_task(async function test_translated_title() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div title="The title is translated" class="do-not-translate-this">
      Inner text is translated.
    </div>
  `);

  translate();

  await htmlMatches(
    "Language matching of elements behaves as expected.",
    /* html */ `
    <div title="THE TITLE IS TRANSLATED" class="do-not-translate-this">
      INNER TEXT IS TRANSLATED.
    </div>
    `
  );

  cleanup();
});

add_task(async function test_translated_aria_attributes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div aria-label="label" aria-description="description" aria-brailleroledescription="brailleroledescription" aria-braillelabel="braillelabel" aria-placeholder="aria_placeholder" aria-roledescription="roledescription" aria-valuetext="valuetext" aria-colindextext="colindextext" aria-rowindextext="rowindextext">
      Content
    </div>
  `);

  translate();

  await htmlMatches(
    "ARIA attributes are translated",
    /* html */ `
    <div aria-label="LABEL" aria-description="DESCRIPTION" aria-brailleroledescription="BRAILLEROLEDESCRIPTION" aria-braillelabel="BRAILLELABEL" aria-placeholder="ARIA_PLACEHOLDER" aria-roledescription="ROLEDESCRIPTION" aria-valuetext="VALUETEXT" aria-colindextext="COLINDEXTEXT" aria-rowindextext="ROWINDEXTEXT">
      CONTENT
    </div>
    `
  );

  cleanup();
});

add_task(async function test_title_attribute_subnodes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      <span>Span text 1</span>
      <span>Span text 2</span>
      <span>Span text 3</span>
      <span>Span text 4</span>
      <span>Span text 5</span>
      This is text.
    </div>
  `);

  translate();

  await htmlMatches(
    "Titles are translated",
    /* html */ `
      <div>
        <span>SPAN TEXT 1</span>
        <span>SPAN TEXT 2</span>
        <span>SPAN TEXT 3</span>
        <span>SPAN TEXT 4</span>
        <span>SPAN TEXT 5</span>
        THIS IS TEXT.
      </div>
    `
  );

  cleanup();
});

add_task(async function test_title_attribute_subnodes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div title="Title in div">
      <span title="Title 1">Span text 1</span>
      <span title="Title 2">Span text 2</span>
      <span title="Title 3">Span text 3</span>
      <span title="Title 4">Span text 4</span>
      <span title="Title 5">Span text 5</span>
      This is text.
    </div>
  `);

  translate();

  await htmlMatches(
    "Titles are translated",
    /* html */ `
      <div title="TITLE IN DIV">
        <span title="TITLE 1">SPAN TEXT 1</span>
        <span title="TITLE 2">SPAN TEXT 2</span>
        <span title="TITLE 3">SPAN TEXT 3</span>
        <span title="TITLE 4">SPAN TEXT 4</span>
        <span title="TITLE 5">SPAN TEXT 5</span>
        THIS IS TEXT.
      </div>
    `
  );

  cleanup();
});

add_task(async function test_nested_text_in_attributes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      This is the outer div
      <label>
        Enter information:
        <input type="text">
      </label>
    </div>
  `);

  translate();

  await htmlMatches(
    "translation for Nested with text",
    /* html */ `
      <div>
      THIS IS THE OUTER DIV
      <label>
      ENTER INFORMATION:
        <input type="text">
      </label>
    </div>
    `
  );

  cleanup();
});

add_task(async function test_attributes_with_nested_attributes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div title="Titles are user visible">
      This is the outer div
      <label>
        Enter information:
        <input type="text" placeholder="This is a placeholder">
      </label>
    </div>
  `);

  translate();

  await htmlMatches(
    "Translations: Nested Attributes",
    /* html */ `
      <div title="TITLES ARE USER VISIBLE">
      THIS IS THE OUTER DIV
      <label>
      ENTER INFORMATION:
        <input type="text" placeholder="THIS IS A PLACEHOLDER">
      </label>
    </div>
    `
  );

  cleanup();
});

add_task(
  async function test_notranslate_is_respected_for_attribute_translations() {
    const { translate, htmlMatches, cleanup } =
      await createTranslationsDoc(/* html */ `
    <div class="notranslate" title="A parent element with no-translate">
      This is the outer div
      <label>
        Enter information:
        <input type="text" placeholder="I cannot participate in translations because my parent said no">
      </label>
    </div>
    <input type="text" placeholder="Translate me">
    <input type="text" placeholder="Do not translate me" translate="no">
  `);

    translate();

    await htmlMatches(
      "Translations: No-Translate for Attribute Translations",
      /* html */ `
    <div class="notranslate" title="A parent element with no-translate">
      This is the outer div
      <label>
        Enter information:
        <input type="text" placeholder="I cannot participate in translations because my parent said no">
      </label>
    </div>
    <input type="text" placeholder="TRANSLATE ME">
    <input type="text" placeholder="Do not translate me" translate="no">
    `
    );

    cleanup();
  }
);

add_task(async function test_attribute_translation_for_input_elements() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
      <div>
        <!-- Translate [title], [value] and [alt] attributes -->
        <input type="button" title="button_title" value="button_value" alt="button_alt">
        <input type="reset" title="reset_title" value="reset_value" alt="reset_alt">

        <!-- Do not translate type of submit for value attributes -->
        <input type="submit" title="submit_title" value="submit_value" alt="submit_alt">

        <!-- Translate [title] and [alt] attributes -->
        <input type="image" title="image_title" value="image_value" alt="image_alt">
        <input type="checkbox" title="checkbox_title" value="checkbox_value" alt="checkbox_alt">
        <input type="color" title="color_title" value="color_value" alt="color_alt">
        <input type="date" title="date_title" value="date_value" alt="date_alt">
        <input type="datetime" title="datetime_obsolete_title" value="datetime_value" alt="datetime_obsolete_alt">
        <input type="datetime-local" title="datetime-local_title" value="datetime-local_value" alt="datetime-local_alt">
        <input type="email" title="email_title" value="email_value" alt="email_alt">
        <input type="file" title="file_title" value="file_value" alt="file_alt">
        <input type="hidden" title="hidden_title" value="hidden_value" alt="hidden_alt">
        <input type="month" title="month_title" value="month_value" alt="month_alt">
        <input type="number" title="number_title" value="number_value" alt="number_alt">
        <input type="password" title="password_title" value="password_value" alt="password_alt">
        <input type="radio" title="radio_title" value="radio_value" alt="radio_alt">
        <input type="range" title="range_title" value="range_value" alt="range_alt">
        <input type="search" title="search_title" value="search_value" alt="search_alt">
        <input type="tel" title="tel_title" value="tel_value" alt="tel_alt">
        <input type="text" title="text_title" value="text_value" alt="text_alt">
        <input type="time" title="time_title" value="time_value" alt="time_alt">
        <input type="url" title="url_title" value="url_value" alt="url_alt">
        <input type="week" title="week_title" value="week_value" alt="week_alt">
      </div>
    `);

  translate();

  await htmlMatches(
    "Translations: Attribute Translation for <input> elements",
    /* html */ `
    <div>
      <!-- Translate [title], [value] and [alt] attributes -->
      <input type="button" title="BUTTON_TITLE" value="BUTTON_VALUE" alt="BUTTON_ALT">
      <input type="reset" title="RESET_TITLE" value="RESET_VALUE" alt="RESET_ALT">

      <!-- Do not translate type of submit for value attributes -->
      <input type="submit" title="SUBMIT_TITLE" value="submit_value" alt="SUBMIT_ALT">

      <!-- Translate [title] and [alt] attributes -->
      <input type="image" title="IMAGE_TITLE" value="image_value" alt="IMAGE_ALT">
      <input type="checkbox" title="CHECKBOX_TITLE" value="checkbox_value" alt="CHECKBOX_ALT">
      <input type="color" title="COLOR_TITLE" value="color_value" alt="COLOR_ALT">
      <input type="date" title="DATE_TITLE" value="date_value" alt="DATE_ALT">
      <input type="datetime" title="DATETIME_OBSOLETE_TITLE" value="datetime_value" alt="DATETIME_OBSOLETE_ALT">
      <input type="datetime-local" title="DATETIME-LOCAL_TITLE" value="datetime-local_value" alt="DATETIME-LOCAL_ALT">
      <input type="email" title="EMAIL_TITLE" value="email_value" alt="EMAIL_ALT">
      <input type="file" title="FILE_TITLE" value="file_value" alt="FILE_ALT">
      <input type="hidden" title="HIDDEN_TITLE" value="hidden_value" alt="HIDDEN_ALT">
      <input type="month" title="MONTH_TITLE" value="month_value" alt="MONTH_ALT">
      <input type="number" title="NUMBER_TITLE" value="number_value" alt="NUMBER_ALT">
      <input type="password" title="PASSWORD_TITLE" value="password_value" alt="PASSWORD_ALT">
      <input type="radio" title="RADIO_TITLE" value="radio_value" alt="RADIO_ALT">
      <input type="range" title="RANGE_TITLE" value="range_value" alt="RANGE_ALT">
      <input type="search" title="SEARCH_TITLE" value="search_value" alt="SEARCH_ALT">
      <input type="tel" title="TEL_TITLE" value="tel_value" alt="TEL_ALT">
      <input type="text" title="TEXT_TITLE" value="text_value" alt="TEXT_ALT">
      <input type="time" title="TIME_TITLE" value="time_value" alt="TIME_ALT">
      <input type="url" title="URL_TITLE" value="url_value" alt="URL_ALT">
      <input type="week" title="WEEK_TITLE" value="week_value" alt="WEEK_ALT">
    </div>
    `
  );

  cleanup();
});

add_task(async function test_attribute_translation_for_area_elements() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <map>
      <area alt="area_alt" href="#" target="_blank" shape="area_shape" coords="area_coords" download="area.png" rel="area_rel">
    </map>
    `);

  translate();

  await htmlMatches(
    "Translations: Attribute Translation for <area> elements",
    /* html */ `
    <map>
      <area alt="AREA_ALT" href="#" target="_blank" shape="area_shape" coords="area_coords" download="AREA.PNG" rel="area_rel">
    </map>
    `
  );

  cleanup();
});

add_task(async function test_translated_download_attributes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      <a download="filename.txt" href="#file_url">Link</a>
      <area download="area.png" href="#image_url" shape="rect" coords="area_coords" target="_blank" rel="area_rel">
    </div>
  `);

  translate();

  await htmlMatches(
    "Download attributes are translated on <a> and <area> elements",
    /* html */ `
    <div>
      <a download="FILENAME.TXT" href="#file_url">LINK</a>
      <area download="AREA.PNG" href="#image_url" shape="rect" coords="area_coords" target="_blank" rel="area_rel">
    </div>
    `
  );

  cleanup();
});

add_task(async function test_attribute_translation_for_track_elements() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
      <div>
        <track kind="captions" label="Track label">
        <select>
          <optgroup label="Group 1">
            <option label="option label" value="option_value">Option 1.1</option>
          </optgroup>
        </select>
      </div>
    `);

  translate();

  await htmlMatches(
    "Label attributes are translated on <track>, <optgroup>, and <option> elements",
    /* html */ `
    <div>
      <track kind="captions" label="TRACK LABEL">
      <select>
        <optgroup label="GROUP 1">
          <option label="OPTION LABEL" value="option_value">OPTION 1.1</option>
        </optgroup>
      </select>
    </div>
    `
  );

  cleanup();
});

add_task(async function test_nested_elements() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div>
      This is the outer div
      <label>
        Enter information 1:
        <label>
          Enter information 2:
        </label>
      </label>
    </div>
  `);

  translate();

  await htmlMatches(
    "Translations: Nested elements",
    /* html */ `
      <div>
        THIS IS THE OUTER DIV
        <label>
          ENTER INFORMATION 1:
          <label>
            ENTER INFORMATION 2:
          </label>
        </label>
    </div>
    `
  );

  cleanup();
});

add_task(async function test_node_specific_attributes() {
  const { translate, htmlMatches, cleanup } =
    await createTranslationsDoc(/* html */ `
    <div value="Do not translate div[value]"></div>
    <input type="text" placeholder="This is a placeholder" value="This is a value">
  `);

  translate();

  await htmlMatches(
    "Placeholders support added",
    /* html */ `
      <div value="Do not translate div[value]">
      </div>
      <input type="text" placeholder="THIS IS A PLACEHOLDER" value="This is a value">
    `
  );

  cleanup();
});

add_task(async function test_mutations_with_attributes() {
  const { translate, htmlMatches, cleanup, document } =
    await createTranslationsDoc(/* html */ `
    <div>
      This is a simple translation.
    </div>
  `);

  translate();

  await htmlMatches(
    "It translates.",
    /* html */ `
      <div>
        THIS IS A SIMPLE TRANSLATION.
      </div>
    `
  );

  info('Trigger the "childList" mutation.');
  const div = document.createElement("div");
  div.innerText = "This is an added node.";
  div.setAttribute("title", "title is added");
  document.body.appendChild(div);

  await htmlMatches(
    "The added node gets translated.",
    /* html */ `
      <div>
        THIS IS A SIMPLE TRANSLATION.
      </div>
      <div title="TITLE IS ADDED">
        THIS IS AN ADDED NODE.
      </div>
    `
  );

  info('Trigger the "characterData" mutation.');
  document.querySelector("div").firstChild.nodeValue =
    "This is a changed node.";

  await htmlMatches(
    "The changed node gets translated",
    /* html */ `
      <div>
        THIS IS A CHANGED NODE.
      </div>
      <div title="TITLE IS ADDED">
        THIS IS AN ADDED NODE.
      </div>
    `
  );

  info('Trigger the "childList" mutation.');
  const inp = document.createElement("input");
  inp.setAttribute("placeholder", "input placeholder is added");
  document.body.appendChild(inp);

  await htmlMatches(
    "The placeholder in input node gets translated.",
    /* html */ `
      <div>
          THIS IS A CHANGED NODE.
      </div>
      <div title="TITLE IS ADDED">
        THIS IS AN ADDED NODE.
      </div>
      <input placeholder="INPUT PLACEHOLDER IS ADDED">
    `
  );

  info("Trigger attribute mutation.");
  // adding attribute to first div
  document.querySelector("div").setAttribute("title", "New attribute");
  document.querySelector("input").setAttribute("title", "New attribute input");

  await htmlMatches(
    "The new attribute gets translated.",
    /* html */ `
      <div title="NEW ATTRIBUTE">
          THIS IS A CHANGED NODE.
      </div>
      <div title="TITLE IS ADDED">
        THIS IS AN ADDED NODE.
      </div>
      <input placeholder="INPUT PLACEHOLDER IS ADDED" title="NEW ATTRIBUTE INPUT">
    `
  );

  cleanup();
});

add_task(async function test_mutations_subtree_attributes() {
  const { translate, htmlMatches, cleanup, document } =
    await createTranslationsDoc(/* html */ `
    <div>
      This is a simple translation.
    </div>
  `);

  translate();

  await htmlMatches(
    "It translates.",
    /* html */ `
      <div>
        THIS IS A SIMPLE TRANSLATION.
      </div>
    `
  );

  info('Trigger the "childList" mutation.');
  const div = document.createElement("div");
  div.innerHTML = /* html */ `
    <div title="This is an outer node">
      This is some inner text.
      <input placeholder="This is a placeholder" />
    </div>
  `;
  document.body.appendChild(div.children[0]);

  await htmlMatches(
    "The added node gets translated.",
    /* html */ `
      <div>
        THIS IS A SIMPLE TRANSLATION.
      </div>
      <div title="THIS IS AN OUTER NODE">
        THIS IS SOME INNER TEXT.
        <input placeholder="THIS IS A PLACEHOLDER">
      </div>
    `
  );

  cleanup();
});

add_task(async function test_node_specific_attribute_mutation() {
  const { translate, htmlMatches, cleanup, document } =
    await createTranslationsDoc(/* html */ `
      <div value="Do not translate"></div>
      <input type="button" value="Input value">
    `);

  translate();

  await htmlMatches(
    "The initial setup is translated",
    /* html */ `
      <div value="Do not translate">
      </div>
      <input type="button" value="INPUT VALUE">
    `
  );

  info("Trigger attribute mutations");
  document
    .querySelector("div")
    .setAttribute("value", "New div attribute value");
  document
    .querySelector("input")
    .setAttribute("value", "New input attribute value");

  await htmlMatches(
    "The changed node gets translated",
    /* html */ `
      <div value="New div attribute value">
      </div>
      <input type="button" value="NEW INPUT ATTRIBUTE VALUE">
    `
  );

  cleanup();
});
