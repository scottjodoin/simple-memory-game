class Game {

  constructor(canvas, endCallback){
    this.board = null;
    this.players = null;
    this.cards = null;
    this.flippedCards = [];
    this.canvas = canvas;
    this.mouseFreeze = 0;
    this.fadeTimer = 0;
    this.FADE_LENGTH = 50;
    this.winner = null;
    this.endCallback = endCallback;
  }

  setup(board, players, cards){
    this.board = board;
    this.players = players;
    this.cards = cards;
    this.start();
    this.flippedCards = [];
  }

  start(){
    this.currentPlayer = 0;
    this.firstCard = null;
    this.secondCard = null;
    this.in_progress = true;
  }

  quit(){
    this.in_progress = false;
  }

  nextPlayer(){
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
  }

  getCurrentPlayer(){
    return this.players[this.currentPlayer];
  }

  draw(){
    if (this.board)
      this.board.draw();

    if (this.players)
      for (let i = 0; i < this.players.length; i++){
        let active = (i == this.currentPlayer);
        this.players[i].draw(active);
      }

    if (!!this.cards)
      for (const c of this.cards)
        c.draw();

    if (this.winner)
      this.drawWinner();
  }

  drawWinner(){
    let ctx = this.canvas.getContext('2d');
    ctx.font = "30px Georgia";
    let alpha =   (this.FADE_LENGTH - this.fadeTimer) / this.FADE_LENGTH;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;

    let {x,y,w,h} = this.board.bbox;

    if (this.winner == "tie"){

      ctx.fillText("Draw.", x + 20, y + h/2);
    } else {
      
      let {x:px,y:py,w:pw,h:ph} = this.winner.bbox;
  
      let pyc = py + ph/2;
      let gyc = y + h/2;
      let yy = gyc + (pyc - gyc) / 2;
      ctx.fillText(this.winner.id + " wins.", x + 20, yy );
    }
  }

  step(){
    if (!!this.cards)
      for (let c of this.cards)
        c.step();

    if (this.mouseFreeze > 0)
      this.mouseFreeze--;

    if (this.fadeTimer > 0)
      this.fadeTimer--;

    this.checkMatch();
  }

  mouseDown(x,y){
    if (this.mouseFreeze > 0) return;
    let card = this.board.getCardAt(x, y);
  
    if (!!card && !card.isFlipped){
      card.flip();
      this.flippedCards.push(card);
    }

    this.managePointer(x,y);
  }
  mouseMove(x,y){
    this.managePointer(x,y);
  }
  managePointer(x,y){
    if (this.mouseFreeze > 0) this.canvas.style.cursor = "default";
    
    let overCard = false;
    for (const c of this.cards){
      if (c.isFlipped) continue;
      if (c.isOver(x,y)){
        overCard = true;
        break;
      }
    }

    this.canvas.style.cursor = overCard ? "pointer" : "default";
  }
  checkMatch(){
    if (this.flippedCards.length != 2) return;

    let [first,second] = this.flippedCards;
    if (this.mouseFreeze == 0) {
      this.mouseFreeze = 70;

    } else  if (this.mouseFreeze == 1){
      
      if (first.value == second.value) { // is match 
        this.getCurrentPlayer().addCard(first);
        this.getCurrentPlayer().addCard(second);
        this.board.removeCard(first);
        this.board.removeCard(second);
        
        this.checkEnd();
      } else {
        first.flip(false);
        second.flip(false);
        this.nextPlayer();
      }
      this.flippedCards = [];
    }
  }

  checkEnd(){
    if (this.winner != null) return;
    
    let player1Matches = this.players[0].myCards.length;
    let player2Matches = this.players[1].myCards.length;
    let cardsLeft = this.cards.length - player1Matches - player2Matches;

    if (cardsLeft == 0){
      this.winner = player1Matches == player2Matches ? "tie"
        : (player1Matches > player2Matches)
          ? this.players[0]
          : this.players[1];

      if (typeof this.endCallback === "function") this.endCallback(this.winner);

      this.fadeTimer = this.FADE_LENGTH;
      this.in_progress = false;
      this.draw();
    }
  }
}


class Board {
  constructor(canvas, game, cards, bbox){
    this.canvas = canvas;
    this.game = game;
    this.cards = cards;
    let quasiRatio = 3;
    this.grid_width = Math.floor(Math.sqrt(cards.length * quasiRatio));
    this.grid_height = Math.ceil(cards.length / this.grid_width);
    this.cell_width = Math.max(bbox.w / this.grid_width, 65);
    this.cell_height = Math.max(bbox.h / this.grid_height,95);
    this.bbox = bbox;

    this.setupCards();
  }

  setupCards(){
    let cards = this.cards;
    for (let i = 0; i < this.cards.length; i++){
      let x = i % this.grid_width * this.cell_width + this.bbox.x;
      let y = Math.floor(i / this.grid_width) * this.cell_height + this.bbox.y;
      x = x + (this.cell_width - cards[i].w) / 2;
      y = y + (this.cell_height - cards[i].h) / 2;
      cards[i].jumpTo(x,y);
    }
  }

  coordAtPoint(mx,my){
    let x = Math.floor((mx - this.bbox.x) / this.cell_width);
    let y = Math.floor((my - this.bbox.y) / this.cell_height);
    return {x,y};
  }

  removeCard(card){
    let i = this.cards.indexOf(card);
    this.cards[i].isMatched = true;
  }

  getCardAt(x, y){
    let {x:cx, y:cy} = this.coordAtPoint(x,y);
    if (cx < 0 || cy < 0 || cx >= this.grid_width || cy >= this.grid_height) return null;
    let i = cx + cy * this.grid_width;
    if (i >= this.cards.length) return null;
    return (!this.cards[i].matched) ? this.cards[i] : null;
  }

  draw(){
    let ctx = this.canvas.getContext('2d');
    ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    let {x,y,w,h} = this.bbox;
    ctx.clearRect(x,y,w,h);
    ctx.strokeStyle = '#002200';
    ctx.strokeRect(x,y,w,h);
  }
}

class Card{
  constructor(canvas, id, value, img, backImg, game, board){
    this.canvas = canvas;
    this.id = id;
    this.img = img;
    this.value = value;
    this.backImg = backImg;
    this.game = game;
    this.board = board;
    this.x = 0;
    this.y = 0;
    this.w = 60;
    this.h = 90;

    this.isFlipped = true;
    this.flip();

    let {x,y,w,h} = this;
    this.ghost_rect = {x,y,w,h};

    this.isMatched = false;
    this.player = null;
  }

  
  flip(flipped){
    if (flipped != null && this.isFlipped == flipped) return;
    this.isFlipped = !this.isFlipped;
    this.x += this.w;
    this.w *= -1;
  } 

  jumpTo(x,y){
    this.ghost_rect.x = this.x = x;
    this.ghost_rect.y = this.y = y;
  }

  slideTo(x,y){
    this.x = x;
    this.y = y;
  }

  isOver(mx,my){
    let {x,y,w,h} = this.ghost_rect;
    if (w < 0){
      x += w;
      w *= -1;
    }
    return (mx > x && mx < x + w && my > y && my < y + h);
  }

  step(){
    let {x,y,w,h} = this.ghost_rect;
    x += (this.x - x) / 10;
    y += (this.y - y) / 10;
    w += (this.w - w) / 10;
    h += (this.h - h) / 10;
    this.ghost_rect = {x,y,w,h};
  }

  draw(){
    let ctx = this.canvas.getContext('2d');
    let {x,y,w,h} = this.ghost_rect;
    let img = (w < 0) ? this.backImg : this.img;

    if (w < 0){
      x = x + w;
      w *= -1;
    }

    ctx.strokeStyle = '#000000';
    ctx.strokeRect(x,y,w,h);
    ctx.drawImage(img, x, y, w, h);
  }
}

class Player{
  constructor(canvas, id, color, game, board, cards, bbox){
    this.canvas = canvas;
    this.id = id;
    this.color = color;
    this.game = game;
    this.board = board;
    this.cards = cards;
    this.myCards = [];
    this.name = `Player ${id}`;
    this.bbox = bbox;
  }
  
  addCard(card){
    this.myCards.push(card);
    let {x:bx,y:by,w:bw,h:bh} = this.bbox;
    let x = bx + 10
      + (card.w + 20) * Math.floor((this.myCards.length - 1)/2)
      + this.myCards.length % 2 * 15;
    x = x % (bw - card.w - 20);
    let y = by + (bh - card.h) / 2; 
    card.slideTo(x,y);
    card.flip(true);
  }

  draw(active){
    let ctx = this.canvas.getContext('2d');
    let {x,y,w,h} = this.bbox;
    ctx.fillStyle = (active) ? this.color : '#00000000';
    ctx.clearRect(x,y,w,h);
    ctx.fillRect(x,y,w,h);
    ctx.strokeStyle = "#002200";
    ctx.strokeRect(x,y,w,h);
  }

}