import clsx from "clsx";
import { MouseEvent, TouchEvent, useEffect, useState } from "react";
import styles from './Swipeable.module.css';


interface SwipeableProps {
  children: React.ReactNode;
  handleSwipe: () => void;
  className?: string;
}

// https://codepen.io/swingthing/pen/ZBGBJb/
const Swipeable: React.FC<SwipeableProps> = ({
  children,
  handleSwipe,
  className,
}) => {
  const [state, _setState] = useState({
    left: 0,
    originalOffset: 0,
    velocity: 0,
    timeOfLastDragEvent: 0,
    touchStartX: 0,
    prevTouchX: 0,
    beingTouched: false,
    height: 0,
    intervalId: undefined as number | undefined
  });

  const setState = (values: Partial<typeof state>) => _setState(prevState => ({...prevState, ...values}));

  useEffect(() => {
    window.setTimeout(() => setState({height: 65}), 50);
  }, []);

  const animateSlidingToZero = () => {
    let {left, velocity, beingTouched} = state;

    if (!beingTouched && left < -0.01) {
      velocity += 10 * 0.33;
      left += velocity;

      if (left < -100) {
        window.clearInterval(state.intervalId);
        handleRemoveSelf();
      }

      setState({left, velocity});
    } else if (!beingTouched) {
      left = 0;
      velocity = 0;

      setState({left, velocity, intervalId: undefined, originalOffset: 0});
      window.clearInterval(state.intervalId);
    } else {
      // setState({left: 0});
    }
  }

  const handleRemoveSelf = () => {
    setState({height: 0});
    window.setTimeout(handleSwipe, 250);
  }
  
  const handleStart = (clientX: number) => {
    if (state.intervalId !== undefined) {
      window.clearInterval(state.intervalId);
    }

    setState({
      originalOffset: state.left,
      velocity: 0,
      timeOfLastDragEvent: Date.now(),
      touchStartX: clientX,
      beingTouched: true,
      intervalId: undefined
    });
  }
  
  const handleMove = (clientX: number) => {
    if (state.beingTouched) {
      const touchX = clientX;
      const currTime = Date.now();
      const elapsed = currTime - state.timeOfLastDragEvent;
      const velocity = 20 * (touchX - state.prevTouchX) / elapsed;
      let deltaX = touchX - state.touchStartX + state.originalOffset - 150;

      if (deltaX < -250) {
        handleRemoveSelf();
      } else if (deltaX > 0) {
        deltaX = 0;
      }

      setState({
        left: deltaX,
        velocity,
        timeOfLastDragEvent: currTime,
        prevTouchX: touchX
      });
    }
  }
  
  const handleEnd = () => setState({
      velocity: state.velocity,
      touchStartX: 0,
      beingTouched: false,
      intervalId: window.setInterval(animateSlidingToZero, 33)
    });
  
  const handleTouchStart = (touchStartEvent: TouchEvent<HTMLDivElement>) => {
    handleStart(touchStartEvent.targetTouches[0].clientX);
  }
  const handleTouchMove = (touchMoveEvent: TouchEvent<HTMLDivElement>) => handleMove(touchMoveEvent.targetTouches[0].clientX);
  const handleTouchEnd = () => handleEnd();
  
  // mouse
  const handleMouseDown = (mouseDownEvent: MouseEvent<HTMLDivElement>) => {
    mouseDownEvent.preventDefault();
    handleStart(mouseDownEvent.clientX);
  }
  const handleMouseMove = (mouseMoveEvent: MouseEvent<HTMLDivElement>) => handleMove(mouseMoveEvent.clientX);
  const handleMouseUp = () => handleEnd();
  const handleMouseLeave = () => handleMouseUp();

  return (
    <div
      className={clsx([styles.swipeItem, className])}
      style={{height: state.height + 'px', transition: 'height 250ms ease-in-out'}}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // The following event handlers are for mouse compatibility:
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
        <div
          className={styles["swipeItem-content"]}
          style={{left: state.left + 'px'}}
        >
          {children}
        </div>
    </div>
  );
};

export default Swipeable;
