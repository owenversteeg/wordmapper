const kWidth = 800;
const kHeight = 800;

var gShark = false;
var gFont;

function setFont()
{
  gFont = $('font').value;
}
setFont();

const kVerticalRatio = 0.35;

const commonWords = [
  'the',
  'of',
  'to',
  'and',
  'a',
  'in',
  'is',
  'it',
  'you',
  'that',
  'he',
  'was',
  'for',
  'on',
  'are',
  'with',
  'as',
  'i',
  'his',
  'they',
  'be',
  'at',
  'one',
  'have',
  'this',
  'from',
  'or',
  'had',
  'by',
  'hot',
  'word',
  'but',
  'what',
  'some',
  'we',
  'can',
  'out',
  'other',
  'were',
  'all',
  'there',
  'when',
  'up',
  'use',
  'your',
  'how',
  'said',
  'an',
  'each',
  'she',
  'which',
  'do',
  'their',
  'time',
  'if',
  'will',
  'way',
  'about',
  'many',
  'then',
  'them',
  'write',
  'would',
  'like',
  'so',
  'these',
  'her',
  'long',
  'thing',
  'see',
  'him',
  'two',
  'has',
  'look',
  'more',
  'day',
  'could',
  'go',
  'come',
  'did',
  'no',
  'most',
  'my',
  'over',
  'than',
  'who',
  'may',
  'down',
  'been',
  'any',
  'not'
];

const commonWordMap = {};
for each (let word in commonWords)
commonWordMap[word] = true;

function $(id) {
  return document.getElementById(id);
}

const statusel = $('status');

function setStatus(msg)
{
  statusel.textContent = msg;
}

function getOwnProperties(o)
{
  for (let p in o)
    if (o.hasOwnProperty(p))
      yield [p, o[p]];
}

function range(start, end)
{
  for (; start < end; ++start)
    yield start;
}

/**
 * Somewhat normal distribution of results. The larger the iter, the more linear the distribution.
 */ 
function normalInt(min, max, iter)
{
  return Math.floor([Math.random() for (i in range(0, iter))].reduce(function (i, j) i + j, 0) / iter * (max - min)) + min;
}

function getWordList(text)
{
  let wordmap = {};

  for (let word in getWords(text)) {
    if (wordmap.hasOwnProperty(word)) {
      wordmap[word] += 1;
    }
    else {
      let lcword = word.toLowerCase();
      if (wordmap.hasOwnProperty(lcword)) {
        wordmap[lcword] += 1;
      }
      else {
        let properword = word[0].toUpperCase() + word.slice(1).toLowerCase();
        if (wordmap.hasOwnProperty(properword)) {
          wordmap[word] = wordmap[properword] + 1;
          delete wordmap[properword];
        }
        else {
          wordmap[word] = 1;
        }
      }
    }
  }

  let wordlist = [t for (t in getOwnProperties(wordmap))];
  let max = wordlist.reduce(function(m, cur) { return Math.max(m, cur[1]); }, 0);
  let ratio = 88 / max;
  wordlist = [[word, count * ratio]
              for each ([word, count] in wordlist)];

  wordlist = wordlist.filter(function(e) { return e[1] > 5; });
  wordlist.sort(function(a, b) { return a[1] < b[1]; });

  return wordlist;
}      

function getWords(text)
{
  for each (let word in text.split(/\b/)) {
    if (word.length < 3 || !/[a-zA-Z0-9]/.test(word))
      continue;
    if (commonWordMap.hasOwnProperty(word.toLowerCase()))
      continue;
    yield word;
  }
}

function hitTest(fullimg, wordimg, x, y)
{
  var wdata, fdata, wy, widx, widxend, fidx, wv, fv;

  wdata = wordimg.data;
  fdata = fullimg.data;

  if (x < 0 || y < 0 ||
      x + wordimg.width > fullimg.width ||
      y + wordimg.height > fullimg.height)
    throw new Error("Bad args to hitTest: " + [x, y, wordimg.width, wordimg.height] + Error().stack);

  if (fullimg.minx === undefined)
    throw Error("Nothing placed on fullimg yet?");

  if (x > fullimg.maxx ||
      y > fullimg.maxy ||
      x + wordimg.width < fullimg.minx ||
      y + wordimg.height < fullimg.miny) {
    return false;
  }

  for (wy = wordimg.height - 1; wy >= 0; --wy) {
    widx = wy * wordimg.width * 4;
    widxend = widx + (wordimg.width * 4);

    fidx = ((y + wy) * fullimg.width + x) * 4;
    for (; widx < widxend; widx += 4, fidx += 4) {

      // + 3 is the opacity component
      wv = wdata[widx + 3];
      fv = fdata[fidx + 3];

      if (wv && fv)
        return true;
    }
  }
  return false;
}

function slide(fullimg, wordimg, x, y)
{
  var hitting, i, a, d, ix, iy;

  hitting = hitTest(fullimg, wordimg, x, y);

  for (i = 0; ; ++i) {
    a = Math.pow(Math.log(i), 3) / 4;
    d = a * 4 / 3;

    if (d > kWidth)
      break;

    ix = Math.floor(x + Math.sin(a) * d);
    iy = Math.floor(y + Math.cos(a) * d);

    if (ix < 0 || iy < 0 ||
        ix + wordimg.width > fullimg.width ||
        iy + wordimg.height > fullimg.height)
      continue;

    if (hitTest(fullimg, wordimg, ix, iy) != hitting)
      return [ix, iy];
  }

  return [null, null];
}

function merge(fullimg, wordimg, x, y)
{
  var wdata, fdata, wy, widx, widxend, fidx;

  wdata = wordimg.data;
  fdata = fullimg.data;

  if (x < 0 || y < 0 ||
      x + wordimg.width > fullimg.width ||
      y + wordimg.height > fullimg.height)
    throw new Error("Bad args to merge");

  for (wy = wordimg.height - 1; wy >= 0; --wy) {
    widx = wy * wordimg.width * 4;
    widxend = widx + (wordimg.width * 4);

    fidx = ((y + wy) * fullimg.width + x) * 4;
    for (; widx < widxend; widx += 4, fidx += 4) {
      if (wdata[widx + 3]) {
        // if the word bit has opacity
        fdata[fidx] = wdata[widx];
        fdata[fidx + 1] = wdata[widx + 1];
        fdata[fidx + 2] = wdata[widx + 2];
        fdata[fidx + 3] = wdata[widx + 3];
      }
    }
  }

  if (fullimg.minx === undefined) {
    fullimg.minx = x;
    fullimg.miny = y;
    fullimg.maxx = x + wordimg.width;
    fullimg.maxy = y + wordimg.height;
  }
  else {
    fullimg.minx = Math.min(fullimg.minx, x);
    fullimg.miny = Math.min(fullimg.miny, y);
    fullimg.maxx = Math.max(fullimg.maxx, x + wordimg.width);
    fullimg.maxy = Math.max(fullimg.maxy, y + wordimg.height);
  }
}

function drawWord(cx, word, size, vertical)
{
  cx.font = size + 'px ' + gFont;
  let width = cx.measureText(word).width;

  let geth, getw, _go;

  if (vertical) {
    geth = width + size * 2;
    getw = size * 3;

    cx.textAlign = 'right';

    _go = function() {
      cx.save();
      cx.translate(size, size);
      cx.rotate(270 * Math.PI / 180);
      cx.fillText(word, 0, 0);
      cx.restore();
    }
  }
  else {
    geth = size * 3;
    getw = width + size * 2;

    cx.textAlign = 'left';

    _go = function() {
      cx.fillText(word, size, size);
    }
  }

  cx.clearRect(0, 0, kWidth, kHeight);
  cx.shadowBlur = 0;
  _go();
  let noshadow = cx.getImageData(0, 0, getw, geth);

  cx.clearRect(0, 0, kWidth, kHeight);
  cx.shadowBlur = size / 4;
  _go();
  let shadow = cx.getImageData(0, 0, getw, geth);

  return [noshadow, shadow];
}

function simpletest(cx, imgdata)
{
  let fontsize = 80;

  let [wdata, wshadow] = drawWord(cx, 'Happiness', 80, false);
  merge(imgdata, wdata, 10, 10);

  [wdata, wshadow] = drawWord(cx, 'Sillyness', 60, true);
  let [x,y] = slide(imgdata, wshadow, 600, 20, 0, 20);
  merge(imgdata, wdata, x, y);
}

function draw(text)
{
  statusel.textContent = '';

  let words = getWordList(text);

  let usercx = $('cc').getContext('2d');

  let cx = $('chidden').getContext('2d');
  cx.clearRect(0, 0, kWidth, kHeight);

  cx.textBaseline = 'top';
  cx.shadowColor = "rgba(0, 0, 0, 0.3)";

  let imgdata = cx.getImageData(0, 0, kWidth, kHeight);

  /* comment out testing code */

  // simpletest(cx, imgdata);

  let wdata, wshadow, word, size, vertical, x, y;

  let totalcount = Math.min(words.length, 200);

  if (gShark) {
    connectShark();
    startShark();
  }

  /*
   * place the first word in a position randomly
   */
  [word, size] = words[0];
  setStatus("Placing word '" + word + "': 1/" + totalcount);
  yield;

  vertical = Math.random() < kVerticalRatio;
  [wdata, wshadow] = drawWord(cx, word, size, vertical);
  x = normalInt(0, kWidth - wdata.width, 2);
  y = normalInt(0, kHeight - wdata.height, 2);
  merge(imgdata, wdata, x, y);

  usercx.putImageData(imgdata, 0, 0);
  
  for (let i = 1; i < totalcount; ++i) {
    let [word, size] = words[i];

    setStatus("Placing word '" + word + "': " + (i + 1) + "/" + totalcount);
    yield;

    vertical = Math.random() < kVerticalRatio;
    [wdata, wshadow] = drawWord(cx, word, size, vertical);

    for (let r in placeWord(imgdata, wshadow)) {
      if (r) {
        [x, y] = r;
        merge(imgdata, wdata, x, y);
      }
      else {
        yield;
      }
    }

    usercx.putImageData(imgdata, 0, 0);
  }

  setStatus('Done!');

  if (gShark) {
    stopShark();
    disconnectShark();
  }
}

function placeWord(imgdata, wdata)
{
  let x = normalInt(Math.floor(kWidth / 4), Math.floor(kWidth / 4 * 3), 3);
  let y = normalInt(Math.floor(kHeight / 4), Math.floor(kHeight / 4 * 3), 3);
  for (let t = 1; t < 20; ++t) {
    [x, y] = slide(imgdata, wdata, x, y);
    if (x != null) {
      yield [x, y];
      return;
    }

    yield;

    x = x2;
    y = y2;
  }
}

var gCurDraw;

function drawasync(text)
{
  if (gCurDraw)
    gCurDraw.close();

  function doSomeWork() {
    if (!gCurDraw)
      return;
    try {
      gCurDraw.next();
      setTimeout(doSomeWork, 1);
    }
    catch (e if e instanceof StopIteration) { }
  }

  gCurDraw = draw(text);
  setTimeout(doSomeWork, 1);
}

function cancel()
{
  gCurDraw = null;
  setStatus('cancelled');
}

function asyncTextMap()
{
  drawasync($('inputtext').value);  
}

function asyncFeedMap()
{
  let req = new XMLHttpRequest();
  req.open('GET', 'http://benjamin.smedbergs.us/blog/feed/');
  req.overrideMimeType('text/xml');

  req.onreadystatechange = function (aEvt) {
    if (req.readyState != 4)
      return;

    if (req.status != 200) {
      setStatus('Getting feed failed. Code: ' + req.status);
      return;
    }

    let entries = req.responseXML.querySelectorAll('content[type="html"]');

    let iframe = $('i');
    let docelement = iframe.contentDocument.documentElement;

    let text = '';

    for (let i = entries.length - 1; i >= 0; --i) {
      let entry = entries[i];
      docelement.innerHTML = entry.textContent;
      text += ' ' + docelement.textContent;
    }

    drawasync(text);
  };
  setStatus('Getting BSBlog feed');
  req.send(null);
}
