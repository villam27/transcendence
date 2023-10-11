import React, {useEffect, useState} from 'react';
import {basesize, GuidedBall, Size, start, State} from './game.utils';
import {useGameContext, useUserContext} from '../../contexts';
import {Viewport} from '../../utils';
import Sketch from 'react-p5';
import p5Types from 'p5';
import {RoundButton} from '..';
import {useNavigate} from 'react-router-dom';

// const ball = new Ball({x: 0, y: 0}, 20)

export function Game({viewport}: { viewport: Viewport }) {
  const navigate = useNavigate();
  const {id, socket} = useUserContext();
  const {leaveGame, isInGameWith} = useGameContext();
  const [state, setState] = useState<State>(start);
  const [size, setSize] = useState<Size>(basesize);
  let upPressed = false;
  let downPressed = false;
  const [factor, setFactor] = useState<number>(1);
  const [usernames, setUsernames] = useState<string[]>(['', '']);
  const [ball] = useState<GuidedBall>(new GuidedBall({x: 0, y: 0}));

  // On Component Creation ------------------------------------------------------------------------------------------ //
  useEffect(() => {
    if (!isInGameWith)
      return navigate('/');
    // console.log('[', id, '] emit start_game', { id: id });
    socket?.emit('start_game', {id: id});
    socket?.on('get_usernames', (body: { p1: string, p2: string }) => {
      setUsernames([body.p1, body.p2]);
    });
    // eslint-disable-next-line
  }, [id, socket, isInGameWith, navigate]);

  // In Game Management --------------------------------------------------------------------------------------------- //
  // In Game -- Key Hook -------------------------------------------------------------------------------------------- //
  function keyPressed(p5: p5Types) {
    switch (p5.keyCode) {
      case 38:
        upPressed = true;
        break;
      case 40:
        downPressed = true;
        break;
    }
    move();
  }

  function keyReleased(p5: p5Types) {
    switch (p5.keyCode) {
      case 38:
        upPressed = false;
        break;
      case 40:
        downPressed = false;
        break;
    }
    move();
  }

  // In Game -- Event emission -------------------------------------------------------------------------------------- //
  function move() {
    const isMoving = (upPressed && !downPressed) || (!upPressed && downPressed);
    socket?.emit('move_player', {id: id, isMoving: isMoving, moveUp: upPressed});
  }

  // In Game -- Event reception ------------------------------------------------------------------------------------- //
  // In Game -- Connection Socket ----------------------------------------------------------------------------------- //
  useEffect(() => {
    function onGameStateUpdate(updatedState: {
      ball: { x: number, y: number },
      p1: number,
      p2: number,
      score: { p1: number, p2: number }
    }) {
      setState({
        ball: {x: updatedState.ball.x * factor, y: updatedState.ball.y * factor},
        p1: updatedState.p1 * factor,
        p2: updatedState.p2 * factor,
        score: {p1: updatedState.score.p1, p2: updatedState.score.p2},
      });
    }

    // console.log('[', id, '] subscribed to update_game_state');
    socket?.on('update_game_state', onGameStateUpdate);
    return () => {
      socket?.off('update_game_state', onGameStateUpdate);
    };
    // eslint-disable-next-line
  }, [socket, factor]);

  // Resize Window Management --------------------------------------------------------------------------------------- //

  useEffect(() => {
    const newFactor = Math.min(viewport.width / basesize.width, viewport.height / basesize.height);
    setFactor(newFactor);
    setSize({
      height: basesize.height * newFactor,
      width: basesize.width * newFactor,
      ball: basesize.ball * newFactor,
      bar: {x: basesize.bar.x * newFactor, y: basesize.bar.y * newFactor},
      halfBar: basesize.halfBar * newFactor,
      halfBall: basesize.halfBall * newFactor,
      p1X: basesize.p1X * newFactor,
      p2X: basesize.p2X * newFactor,
    });
  }, [viewport.width, viewport.height]);

  // Display Game Management ---------------------------------------------------------------------------------------- //
  const setup = (p5: p5Types, canvasParentRef: Element) => {
    const canvas = p5.createCanvas(size.width, size.height);
    try {
      canvas.parent(canvasParentRef);
    } catch (e) {
      canvas.parent('container');
    }
    p5.strokeWeight(0);
    p5.background(0);
    p5.textAlign(p5.CENTER, p5.CENTER);
    p5.textSize(32);
    ball.draw(p5, size);
  };

  const draw = (p5: p5Types) => {
    p5.resizeCanvas(size.width, size.height);
    p5.background(60);
    p5.fill(15);
    p5.rect(0, 5, size.width, size.height - 10);
    p5.fill(60);
    p5.ellipse(size.width / 2, size.height / 2, size.ball * 3);
    p5.fill(15);
    p5.ellipse(size.width / 2, size.height / 2, size.ball * 3 - 20);
    p5.fill(60);
    p5.rect(size.width / 2 - 5, 0, 10, size.height);
    p5.ellipse(size.width / 2, size.height / 2, size.ball * 0.5);
    p5.fill(255);
    p5.text(state.score.p1 + ' / ' + state.score.p2, size.width / 2, 25);

    // p5.ellipse(state.ball.x, state.ball.y, size.ball);
    ball.update(state.ball, size);
    ball.draw(p5, size);


    for (let i = 0; i < 12; i+=1) {
      p5.fill(255, 0, 0, 25)
      p5.rect(size.p1X - size.bar.x - i, state.p1 - size.halfBar - i, size.bar.x + 2 * i, size.bar.y + 2 * i, 1.5*i)
      p5.fill(0, 0, 255, 25)
      p5.rect(size.p2X - i, state.p2 - size.halfBar - i, size.bar.x + 2 * i, size.bar.y + 2 * i, 1.5*i)
    }
    p5.fill(255);
    p5.rect(size.p1X - size.bar.x, state.p1 - size.halfBar, size.bar.x, size.bar.y);
    p5.rect(size.p2X, state.p2 - size.halfBar, size.bar.x, size.bar.y);
  };

  return (
    <div id={'container'} style={containerStyle}>
      <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%'}}>
        <p>{usernames[0]}</p>
        <p>{usernames[1]}</p>
      </div>
      {id && socket && isInGameWith &&
          <Sketch setup={setup} draw={draw} keyPressed={keyPressed} keyReleased={keyReleased}
                  style={{position: 'relative', top: '0'}}></Sketch>}
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <RoundButton icon={require('../../assets/imgs/icon_close.png')} onClick={() => {
          leaveGame();
        }}></RoundButton>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: '100%',
  minWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
};