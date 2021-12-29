const _canvas = document.getElementById('canvas');
_canvas.addEventListener('mousedown',canvasMouseDown);
_canvas.addEventListener('mousemove', canvasMouseMove);
const interval = setInterval(step,10);

const _cards = [];
loadCards(cardsLoaded);
let _board;
const _players = [];
const _game = new Game(_canvas, endGame);
let _imagesLoaded = false;

function step(){
  if (!!_board){
    _game.step();
    _game.draw();
  }
}

function canvasMouseMove(e){
  if (!_imagesLoaded) return;
  let {mx,my} = getMouseCoords(e);
  _game.mouseMove(mx,my);
}

function canvasMouseDown(e){
  if (!_imagesLoaded) return;
  let {mx,my} = getMouseCoords(e);
  _game.mouseDown(mx,my);

}

function getMouseCoords(e){
  let cs = getComputedStyle(canvas);

  let cWidth = parseInt(cs.getPropertyValue('width'));
  let cHeight = parseInt(cs.getPropertyValue('height'));

  let x = e.offsetX;
  let y = e.offsetY;

  let mx = x * _canvas.width / cWidth;
  let my = y * _canvas.height / cHeight;  
  return {mx,my};
}

function cardsLoaded(){
  _imagesLoaded = true;
  _canvas.style.backgroundColor = "green";
  let ctx = _canvas.getContext('2d');
  console.log("loaded");

  // shuffle the cards
  fisherYatesShuffle(_cards);

  // set up the board
  let boardRect = {x:5, y:120, w:590, h:340}
  _board = new Board(_canvas, _game, _cards, boardRect);

  // set up the players
  _players.push(new Player(_canvas,'Player 1', '#f2f542aa', _game, _board, _cards, {x:5, y:5, w:590, h:100}));
  let player2Y = boardRect.y + boardRect.h + 10;
  _players.push(new Player(_canvas,'Player 2', '#db9dfcaa', _game, _board, _cards, {x:5, y: player2Y, w:590, h:100}));  

  // set up the game
  _game.setup(_board,_players,_cards);
}

function fisherYatesShuffle(array) {
  var i = array.length;
  if (i == 0) return false;
  while (--i) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
function endGame(){
  document.getElementById("btn-restart-end").style.display = "block";
  //clearInterval(interval);
}
function loadCards(callback){
  let backImg = new Image();
  backImg.src = 'img/back.png';


  backImg.onload = function(){
    const cardCount = 12;
    for (let i = 1; i <= cardCount; i++){

      for (type of ['A','B']){

        let img = new Image();
        let id = '' + i + type; // string concatenation
        let value = i;
        
        img.src = 'img/c' + i + '.png';
        
        img.onload = ()=>{
          _cards.push(new Card(_canvas, id, value, img, backImg, _game, _board));
          if (_cards.length == cardCount * 2 && callback) callback();
        }
      }
    }
  }
}
