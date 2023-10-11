import React, {useEffect, useState} from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';
import {AutonomousBall, basesize, Size} from '../Game/game.utils';
import {Viewport} from '../../utils';

interface Props {
  viewport: Viewport;
  style ?: React.CSSProperties;
}

export function AnimatedBackground(props: Props) {
  const [size, setSize] = useState<Size>({...basesize, ball: 30});
  const [ball] = useState<AutonomousBall>(new AutonomousBall({x: 50, y: 50}, {x: 4, y: 7}));
  const [balls] = useState<AutonomousBall[]>([]);

  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      balls.push(new AutonomousBall({
          x: Math.random() * (props.viewport.width - (size.ball * 3)) + (size.ball * 1.5),
          y: Math.random() * (props.viewport.height - (size.ball * 3)) + (size.ball * 1.5),
        },
        {
          x: (Math.random() * 20) - 10,
          y: (Math.random() * 20) - 10
        }));
    }
  }, []);

  useEffect(() => {
    setSize({
      ...size,
      width: props.viewport.width,
      height: props.viewport.height,
    });
  }, [props.viewport.width, props.viewport.height]);

  function setup(p5: p5Types, canvasParentRef: Element) {
    const canvas = p5.createCanvas(size.width, size.height);
    try {
      canvas.parent(canvasParentRef);
    } catch (e) {
      canvas.parent('container');
    }
  }

  function draw(p5: p5Types) {
    p5.resizeCanvas(size.width, size.height);
    p5.background(60);
    p5.fill(20);
    p5.rect(5, 5, size.width - 10, size.height - 10);
    p5.fill(60);
    p5.circle(size.width / 2, size.height / 2, size.ball * 8);
    p5.fill(20);
    p5.circle(size.width / 2, size.height / 2, size.ball * 8 - 20);
    p5.fill(60);
    p5.rect(size.width / 2 - 5, 0, 10, size.height);
    p5.circle(size.width / 2, size.height / 2, size.ball);
    p5.fill(255, 0, 255);
    for (const ball of balls) {
      ball.update(size);
      ball.draw(p5, size);
    }
  }

  return (
    <Sketch draw={draw} setup={setup} style={{position: 'absolute', top: 0, left: 0, height: '100vh', width:'100vw', ...props.style}}/>
  )
}