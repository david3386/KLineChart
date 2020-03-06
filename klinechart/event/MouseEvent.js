import Event from './Event'
import { stopEvent, isValidEvent, getCanvasPoint } from './eventHelper'

const CROSS = 'cross'
const DRAG = 'drag'

class MouseEvent extends Event {
  constructor (
    tooltipChart, candleChart, volChart,
    subIndicatorChart, xAxisChart,
    markerChart, storage
  ) {
    super(tooltipChart, candleChart, volChart, subIndicatorChart, xAxisChart, storage)
    this.markerChart = markerChart
    // 事件模型
    this.mouseMode = CROSS
    this.mouseDownPoint = { x: 0, y: 0 }
    this.documentMouseUp = () => {
      document.removeEventListener('mouseup', this.documentMouseUp, false)
      this.mouseMode = CROSS
      this.storage.isDragGraphicMark = false
      this.tooltipChart.flush()
    }
  }

  /**
   * 鼠标按下事件
   * @param e
   */
  mouseDown (e) {
    if (this.storage.dataList.length === 0) {
      return
    }
    if (e.button === 0) {
      const point = getCanvasPoint(e, this.tooltipChart.canvasDom)
      if (!isValidEvent(point, this.handler)) {
        return
      }
      document.addEventListener('mouseup', this.documentMouseUp, false)
      this.mouseDownPoint.x = e.x
      this.mouseDownPoint.y = e.y
      this.mouseMode = DRAG
      this.storage.crossPoint = null
      this.tooltipChart.flush()
    }
  }

  /**
   * 鼠标抬起时事件
   * @param e
   */
  mouseUp (e) {
    if (this.storage.dataList.length === 0) {
      return
    }
    stopEvent(e)
    const point = getCanvasPoint(e, this.tooltipChart.canvasDom)
    if (!isValidEvent(point, this.handler)) {
      return
    }
    document.removeEventListener('mouseup', this.documentMouseUp, false)
    this.mouseMode = CROSS
    this.storage.crossPoint = { x: point.x, y: point.y }
    this.storage.isDragGraphicMark = false
    this.tooltipChart.flush()
  }

  mouseLeave (e) {
    if (this.storage.dataList.length === 0) {
      return
    }
    stopEvent(e)
    this.storage.crossPoint = null
    this.tooltipChart.flush()
  }

  /**
   * 鼠标移动时事件
   * @param e
   * @param loadMore
   */
  mouseMove (e, loadMore) {
    if (this.storage.dataList.length === 0) {
      return
    }
    stopEvent(e)
    const point = getCanvasPoint(e, this.tooltipChart.canvasDom)
    if (!isValidEvent(point, this.handler)) {
      this.storage.crossPoint = null
      this.tooltipChart.flush()
      return
    }
    if (!this.waitingForMouseMoveAnimationFrame) {
      this.waitingForMouseMoveAnimationFrame = true
      if (this.mouseMode === DRAG) {
        if (this.storage.isDragGraphicMark) {
          this.cross(point)
        } else {
          if (this.drag(this.mouseDownPoint, e.x, loadMore)) {
            this.markerChart.flush()
          }
        }
      } else if (this.mouseMode === CROSS) {
        this.cross(point)
      }
      this.waitingForMouseMoveAnimationFrame = false
    }
  }

  /**
   * 鼠标滚轮事件
   * @param e
   */
  mouseWheel (e) {
    if (this.storage.dataList.length === 0 || this.storage.isDragGraphicMark) {
      return
    }
    stopEvent(e)
    const point = getCanvasPoint(e, this.tooltipChart.canvasDom)
    if (!isValidEvent(point, this.handler)) {
      return
    }
    const touchStartPosition = this.storage.minPos
    const touchRange = this.storage.range
    const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.deltaY)))
    // 是否缩小
    const isZoomingOut = delta === 1
    let scaleX = 1
    if (isZoomingOut) {
      scaleX = 0.95
    } else {
      scaleX = 1.05
    }
    if (this.zoom(isZoomingOut, scaleX, touchStartPosition, touchRange)) {
      this.cross(point)
      this.markerChart.flush()
    }
  }
}

export default MouseEvent
