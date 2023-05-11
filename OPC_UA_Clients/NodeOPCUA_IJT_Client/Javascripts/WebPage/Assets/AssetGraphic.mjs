
export default class AssetGraphics {
  constructor (container) {
    const backGround = document.createElement('div')
    backGround.classList.add('datastructure')
    container.appendChild(backGround)

    const leftHalf = document.createElement('div')
    leftHalf.classList.add('lefthalf')
    leftHalf.classList.add('scrollableInfoArea')
    backGround.appendChild(leftHalf)

    const nodeDiv = document.createElement('div')
    nodeDiv.classList.add('myHeader')
    nodeDiv.innerText = 'AssetView'
    leftHalf.appendChild(nodeDiv)

    const displayArea = document.createElement('div')
    displayArea.classList.add('drawAssetBox')
    leftHalf.appendChild(displayArea)

    /*
    const canvasArea = document.createElement('canvas')
    canvasArea.classList.add('canvasBox')
    leftHalf.appendChild(canvasArea)
    */

    this.container = displayArea
  }

  createController (node, controllerNr, parts) {
    const rightPercent = 75
    // const nodeId = node.NodeId
    const height = 100 / parts
    if (!node.assetGraphicData) {
      node.assetGraphicData = {}
    }
    const mainbox = document.createElement('div')
    mainbox.classList.add('assetArea')
    mainbox.style.left = '0%'
    mainbox.style.right = '0%'
    mainbox.style.top = Math.round(controllerNr * height) + '%'
    mainbox.style.height = height + '%'
    this.container.appendChild(mainbox)

    const leftbox = document.createElement('div')
    leftbox.classList.add('assetArea')
    leftbox.innerText = ''
    leftbox.style.left = '0%'
    leftbox.style.right = (100 - rightPercent) + '%'
    leftbox.style.top = '0%'
    leftbox.style.height = '100%'
    mainbox.appendChild(leftbox)

    const rightbox = document.createElement('div')
    rightbox.classList.add('assetArea')
    rightbox.innerText = 'Tools'
    rightbox.style.left = rightPercent + '%'
    rightbox.style.right = '0%'
    rightbox.style.top = '0%'
    rightbox.style.height = '100%'
    mainbox.appendChild(rightbox)
    node.assetGraphicData.tools = rightbox
    rightbox.assetInternals = []

    return this.createAssetContainer(node, leftbox)
  }

  addInternal (node, containerNode) {
    this.addHorizontal(node, containerNode.assetGraphicData.internals)
  }

  addExternal (node, containerNode) {
    this.addHorizontal(node, containerNode.assetGraphicData.externals)
  }

  addTool (node, containerNode) {
    this.addVertical(node, containerNode.assetGraphicData.tools)
  }

  createAssetContainer (node, container) {
    if (!node.assetGraphicData) {
      node.assetGraphicData = {}
    }
    const asset = document.createElement('div')
    asset.classList.add('assetArea')
    asset.innerText = node.displayName.text
    asset.style.backgroundColor = 'brown'
    asset.style.left = '10%'
    asset.style.right = '10%'
    asset.style.top = '5%'
    asset.style.height = '40%'
    container.appendChild(asset)
    node.assetGraphicData.internals = asset
    asset.assetInternals = []

    const externals = document.createElement('div')
    externals.classList.add('assetArea')
    externals.style.left = '0%'
    externals.style.right = '0%'
    externals.style.top = '50%'
    externals.style.height = '50%'
    container.appendChild(externals)
    node.assetGraphicData.externals = externals
    externals.assetInternals = []
    return asset
  }

  addHorizontal (node, container) {
    const mainbox = document.createElement('div')
    mainbox.classList.add('assetBox')
    mainbox.innerText = node.displayName.text
    mainbox.style.top = '60%'
    mainbox.style.bottom = '10%'
    container.appendChild(mainbox)
    container.assetInternals.push(mainbox)
    const width = 100 / container.assetInternals.length
    let i = 0
    for (const internal of container.assetInternals) {
      internal.style.left = ((i++ * width) + (width / 10)) + '%'
      internal.style.width = (0.8 * width) + '%'
    }
    return mainbox
  }

  addVertical (node, container) {
    const mainbox = document.createElement('div')
    mainbox.classList.add('assetBox')
    mainbox.style.left = '10%'
    mainbox.style.right = '10%'
    container.appendChild(mainbox)
    container.assetInternals.push(mainbox)
    const height = 100 / container.assetInternals.length
    let i = 0
    for (const internal of container.assetInternals) {
      internal.style.top = ((i++ * height) + (height / 10)) + '%'
      internal.style.height = (0.8 * height) + '%'
    }
    this.createAssetContainer(node, mainbox)

    return mainbox
  }
}
