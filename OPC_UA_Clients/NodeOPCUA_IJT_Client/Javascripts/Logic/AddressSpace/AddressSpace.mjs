import { NodeFactory } from './Node.mjs'

export default class AddressSpace {
  constructor (socketHandler) {
    this.socketHandler = socketHandler
    this.nodeMapping = {}
    this.objectFolder = null
    // this.selectedTighteningSystem = null
    // this.typeMapping = typeMapping
    this.listOfTSPromises = []
    this.ParentRelationSubscription = []
    this.newNodeSubscription = []
  }

  /**
   *
   */
  createNode (nodeData) {
    console.log('fixit')
    const newNode = this.findOrCreateNode(nodeData)

    // console.log(newNode.getRelation('ns=0;i=86'))
    console.log(newNode.getNamedRelation('Objects'))
    // console.log(newNode.getRelations('organizes'))

    for (const callback of this.newNodeSubscription) {
      callback(newNode)
    }
    return newNode
  }

  /**
   *
   */
  findOrCreateNode (nodeData) {
    let returnNode = this.nodeMapping[nodeData.nodeid]
    if (!returnNode) {
      returnNode = this.createBasicNode(nodeData)
    }
    return returnNode
  }

  /**
   *
   */
  findOrLoadNode (nodeId) {
    const returnNode = this.nodeMapping[nodeId]
    if (returnNode) {
      return new Promise((resolve, reject) => {
        resolve(returnNode)
      })
    } else {
      return new Promise((resolve, reject) => {
        this.browseAndRead(nodeId, true).then((m) => {
          resolve(this.createNode(m))
        })
      })
    }
  }

  createBasicNode (basicNodeData) {
    const newNode = NodeFactory(basicNodeData)
    this.nodeMapping[newNode.nodeId] = newNode
    return newNode
  }

  /**
   * Core function that creates a parent if none exists and creates the current node to it
   * @param {*} reference the reference data type
   * @param {*} thisNode the current node
   * @param {*} makeGUI Should this generate a representation in the structure view
   * @returns a reference
   *
  makeParentAndConnect (reference, thisNode, makeGUI) {
    let parent = this.nodeMapping[reference.nodeId]
    if (parent) {
      parent.addBrowseData(reference)
      // thisNode.setParent(parent)
      for (const callback of this.ParentRelationSubscription) {
        callback(parent, thisNode)
      }
      if (!thisNode.browseName) {
        parent.GUIexplore(makeGUI) // Forcing parent to get this node's name
      }
    } else {
      parent = this.createBasicNode(reference)
      parent.addRelation('component', thisNode.nodeId, thisNode)
      parent.GUIexplore(makeGUI)
      // thisNode.setParent(parent)
      for (const callback of this.ParentRelationSubscription) {
        callback(parent, thisNode)
      }
    }
    return parent
  } */

  handleNamespaces (namespaces) {
    this.nsIJT = namespaces.indexOf('http://opcfoundation.org/UA/IJT/')
    this.nsMachinery = namespaces.indexOf('http://opcfoundation.org/UA/Machinery/')
    this.nsDI = namespaces.indexOf('http://opcfoundation.org/UA/DI/')
    this.nsIJTApplication = namespaces.indexOf('http://www.atlascopco.com/TighteningApplication/')
  }

  /**
   * Sets up root and the Object folder
   */
  initiate () {
    this.loadAndCreate('ns=0;i=84') // GRoot
    this.loadAndCreate('ns=0;i=85') // Get Objects
  }

  loadAndCreate (nodeId) {
    this.browseAndRead(nodeId, true).then((m) => {
      this.createNode(m)
    })
  }

  reset () {
    this.nodeMapping = {}
  }

  cleanse (node) {
    console.log(`Cleansing node ${node.nodeId}`)
    this.nodeMapping[node.nodeId] = null
  }

  setGUIGenerator (graphicGenerator) {
    this.graphicGenerator = graphicGenerator
  }

  /**
   * A promise to browse and read a node, given only a nodeId
   * @param {*} nodeId
   * @returns the node
   */
  browseAndReadWithNodeId (nodeId, details = false) {
    let referencedNode = this.nodeMapping[nodeId]
    if (!referencedNode) {
      referencedNode = this.createBasicNode({ nodeId }, null, details)
    }
    return referencedNode.GUIexplore(details)
  }

  // This is called whenever a node has been being read
  addNodeByRead (msg) {
    if (!msg.dataValue.value) {
      return
    }
    const node = this.nodeMapping[msg.nodeid]
    if (node) {
      node.addReadData(msg.dataValue.value)
    }
    return node
  }

  toString (nodeId) {
    const node = this.nodeMapping[nodeId]
    if (!node) {
      return nodeId + ' has not been browsed yet'
    }
    return node.toString()
  }

  getTighteningsSystemsPromise () {
    return new Promise((resolve, reject) => {
      if (this.objectFolder) {
        resolve(this.getTighteningSystems())
        return
      }
      this.listOfTSPromises.push({ resolve, reject })
    }
    )
  }

  getTighteningSystems () {
    if (!this.objectFolder) {
      throw new Error('Root/Objects folder not found')
    }
    const tighteningSystems = []
    for (const node of this.objectFolder.getRelations('organizes')) {
      if (node.typeDefinition === 'ns=4;i=1005') {
        tighteningSystems.push(node)
      }
    }
    return tighteningSystems
  }

  /**
   * note that this normally only returns the call message, not the actual node as might be expected.
   * The nodeId needs to be extracted from the message.
   * @param {*} path The path that should be traversed
   * @param {*} startFolderId The starting node
   * @returns the call message
   */
  findFolder (path, startFolderId) {
    if (!startFolderId) {
      const tgtSystem = this.getTighteningSystems()
      if (tgtSystem.length > 0) {
        startFolderId = tgtSystem[0].nodeId
      } else {
        throw new Error('Failed to find starting folder')
      }
    }
    return this.socketHandler.pathtoidPromise(startFolderId, path)
  }

  subscribeToNewNode (callback) {
    this.newNodeSubscription.push(callback)
  }

  subscribeToParentRelation (callback) {
    this.ParentRelationSubscription.push(callback)
  }

  /**
   * Use addressSpace.browseAndReadWithNodeId if only the Id is available
   * @param {*} response
   * @returns
   */
  browseAndRead (nodeId, details = false) {
    return this.socketHandler.browsePromise(nodeId, details).then(
      (browseMsg) => {
        return new Promise((resolve) => {
          this.socketHandler.readPromise(nodeId, 'DisplayName').then(
            (readname) => {
              return new Promise(() => {
                this.socketHandler.readPromise(nodeId, 'NodeClass').then(
                  (readclass) => {
                    const returnValue = {
                      nodeid: browseMsg.message.nodeid,
                      nodeclass: readclass.message.dataValue.value,
                      displayname: readname.message.dataValue.value,
                      relations: browseMsg.message.browseresult.references
                    }
                    resolve(returnValue)
                  })
              })
            })
        })
      })
  }

  read (nodeId, attribute) {
    // console.log('SEND Read: '+this.nodeId)
    return new Promise((resolve) => {
      this.socketHandler.readPromise(nodeId, attribute).then(
        (response) => {
          resolve(response.node)
        })
    })
  }
}
