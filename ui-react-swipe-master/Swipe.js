
import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';
// import './Swipe.scss';

class Swipe extends Component {

  constructor(props) {
    super(props);
    this.state = {
      items       : [],
      activeIndex : this.props.activeIndex,
      translateX  : 0,
      moveInterval: undefined,
      pointStart  : 0,
      pointEnd    : 0,
    };
  }

  componentWillMount() {
    // 拼接头尾
    let items = [].concat(this.props.children),
        firstItem = items[0],
        lastItem = items[items.length - 1];
    items.push(firstItem);
    items.unshift(lastItem);

    this.setState({
      items       : items,
    });
  }

  componentDidMount() {
    // 监听窗口变化
    window.addEventListener("resize", () => this._updateResize());

    // 设置起始位置编号
    this.onJumpTo(this.props.activeIndex);
    this.startAutoplay();
  }

  componentWillUnmount() {
    this.pauseAutoplay();
    window.removeEventListener("resize", () => this._updateResize());
  }

  // 滑动到指定编号
  onSlideTo(index) {
    this._onMoveTo(index, this.props.speed);
  }

  // 静默跳到指定编号
  onJumpTo(index) {
    this._onMoveTo(index, 0);
  }

  // 自动轮播开始
  startAutoplay() {
    const interval = (this.props.autoplay && setInterval(() => {

      let activeIndex = this.state.activeIndex,
          maxLength = this.props.children.length;

      activeIndex = (['left', 'top'].indexOf(this.props.direction) > -1)
                  ? (activeIndex + 1)
                  : (activeIndex - 1);

      if (activeIndex > maxLength - 1) {
        activeIndex = 0;
        this.onJumpTo(-1);
        this.onSlideTo(activeIndex);
      } else if (activeIndex < 0) {
        activeIndex = maxLength - 1;
        this.onJumpTo(maxLength);
        this.onSlideTo(activeIndex);
      } else {
        this.onSlideTo(activeIndex);
      }

    }, this.props.autoplayIntervalTime));

    this.setState({
      moveInterval: interval,
    });
  }

  // 暂停自动轮播
  pauseAutoplay() {
    if (this.state.moveInterval) { 
      clearInterval(this.state.moveInterval);
    }
  }

  // 更新窗口变化的位置偏移
  _updateResize() {
    this.onJumpTo(this.props.activeIndex);
  }

  // 移动到指定编号
  _onMoveTo(index, speed) {
    const dom = this.refs.swipeItems,
          px = (this._isDirectionX())
             ? -dom.offsetWidth * (index + 1)
             : -dom.offsetHeight * (index + 1);

    this._doTransition(dom, px, speed);

    this.setState({
      activeIndex: index,
      translateX : px,
    });
  }

  // 执行过渡动画
  _doTransition(dom, offset, duration) {
    let x = 0,
        y = 0;

    if (this._isDirectionX()) {
      x = offset;
    } else {
      y = offset;
    }

    dom.style.webkitTransitionDuration = duration + "ms";
    dom.style.mozTransitionDuration = duration + "ms";
    dom.style.oTransitionDuration = duration + "ms";
    dom.style.transitionDuration = duration + "ms";
    dom.style.webkitTransform = "translate(" + x + "px, " + y + "px)";
    dom.style.mozTransform = "translate(" + x + "px, " + y + "px)";
    dom.style.oTransform = "translate(" + x + "px, " + y + "px)";
    dom.style.transform = "translate(" + x + "px, " + y + "px)"; 
  }

  // 触屏事件
  _onTouchStart(event) {
    this.pauseAutoplay();

    let pointX = this._getCurrentPoint(event),
        activeIndex = this.state.activeIndex,
        maxLength = this.props.children.length;

    if (activeIndex <= 0) {
      this.onJumpTo(0);
    } else if (activeIndex >= (maxLength - 1)) {
      this.onJumpTo(maxLength - 1);
    }

    this.setState({ 
      pointStart: pointX
    });
  }

  _onTouchMove(event) {
    event.preventDefault();

    const pointX = this._getCurrentPoint(event),
          px = this.state.translateX  + (pointX - this.state.pointStart),
          dom = this.refs.swipeItems;

    this._doTransition(dom, px, 0);
    this.setState({
      pointEnd: pointX
    });
  }

  _onTouchEnd(event) {
    // event.stopPropagation();

    const px = (this.state.pointEnd !== 0)
             ? this.state.pointEnd - this.state.pointStart
             : 0,
          dom = this.refs.swipeItems;

    let activeIndex = this.state.activeIndex,
        maxLength = this.props.children.length;

    if (Math.abs(px / dom.offsetWidth) >= this.props.longSwipesRatio) {

      activeIndex = (px > 0)
                  ? (this.state.activeIndex - 1)
                  : (this.state.activeIndex + 1);

      this.onSlideTo(activeIndex);

      if (activeIndex > maxLength - 1) {
        activeIndex = 0;
      } else if (activeIndex < 0) {
        activeIndex = maxLength - 1;
      }

    } else {
      this.onSlideTo(activeIndex);
    }

    // 恢复自动轮播
    this.startAutoplay();

    this.setState({
      pointStart: 0,
      pointEnd: 0,
      activeIndex: activeIndex,
    });
  }

  // 获取鼠标/触摸点坐标
  _getCurrentPoint(event, type) {
    var touch = (type == 'mouse')
              ? event
              : event.touches[0];

    var offset = (this._isDirectionX())
               ? touch.pageX
               : touch.pageY;
    return offset;
  }

  // 是否横向移动
  _isDirectionX() {
    var dir = (['left', 'right'].indexOf(this.props.direction) > -1)
            ? true
            : false;
    return dir;
  }

  render () {
    // console.log('render');
    
    const itemsStyle = {},
          pageStyle = {};

    if (!this._isDirectionX()) {
      itemsStyle.height = this.props.height;
      pageStyle.marginTop = 3;
    } else {
      // itemsStyle.height = this.props.height;
      itemsStyle.whiteSpace = 'nowrap';
      pageStyle.display = 'inline-block';
      pageStyle.marginRight = 3;
    }

    return (
      <div className="ui-swipe">
        <div ref="swipeItems"
          className="ui-swipe-items"
          style={itemsStyle}
          onTouchStart={(event) => this._onTouchStart(event)}
          onTouchMove={(event) => this._onTouchMove(event)}
          onTouchEnd={(event) => this._onTouchEnd(event)}>
          { this.state.items }
        </div>
        <div className="ui-swipe-pagination">
          <ul>
            {
              this.props.children.map((result, index) => {
                return <li key={"pagination-" + index} className={classnames({'active': index == this.state.activeIndex})} style={pageStyle} onClick={() => this.onSlideTo(index)} />
              })
            }
          </ul>
        </div>
      </div>
    );
  }

}

Swipe.propTypes = {
  direction           : PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  height              : PropTypes.number,
  activeIndex         : PropTypes.number,
  speed               : PropTypes.number,
  autoplay            : PropTypes.bool,
  autoplayIntervalTime: PropTypes.number,
  longSwipesRatio     : PropTypes.number,
};

Swipe.defaultProps = {
  direction           : 'left',
  height              : 160,
  activeIndex         : 0,
  speed               : 300,
  autoplay            : true,
  autoplayIntervalTime: 3000,
  longSwipesRatio     : 0.5,
};

export default Swipe;

