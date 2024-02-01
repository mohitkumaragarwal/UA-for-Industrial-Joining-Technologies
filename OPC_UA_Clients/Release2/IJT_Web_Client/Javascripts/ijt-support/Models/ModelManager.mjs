/* eslint-disable */
import ResultValueDataType from './Results/ResultValueDataType.mjs'
//import ProcessingTimesDataType from './ProcessingTimesDataType.mjs'
import { DefaultNode, BrowseNameDataType, DisplayNameDataType } from './DefaultNode.mjs'
//import ErrorInformationDataType from './ErrorInformationDataType.mjs'
import TighteningDataType from './Results/TighteningDataType.mjs'
import BatchDataModel from './Results/BatchDataType.mjs'
import JobDataModel from './Results/JobDataModel.mjs'
import ResultDataType from './Results/ResultDataType.mjs'
import JoiningResultDataType from './Results/JoiningResultDataType.mjs'
import StepResultDataType from './Results/StepResultDataType.mjs'
import TagDataType from './TagDataType.mjs'
import { LocalizationModel, 
  keyValuePair, 
  NodeId,
  ErrorInformationDataType,
  ProcessingTimesDataType } from './SupportModels.mjs'
import { TighteningTraceDataType, StepTraceDataType, TraceContentDataType, TraceValueDataType } from './Results/TighteningTraceDataType.mjs'
import ResultMetaData from './Results/ResultMetaData.mjs'
// import ResultContent from './ResultContent.mjs'
import AssociatedEntities from './AssociatedEntities.mjs'
import ResultCounters from './Results/ResultCounters.mjs'
import JoiningSystemEventModel from './Events/JoiningSystemEventModel.mjs'
import JoiningSystemResultReadyEvent from './Events/JoiningSystemResultReadyEventModel.mjs'
import IJTBaseModel from './IJTBaseModel.mjs'

/* eslint-disable */
export class ModelManager {
  constructor () {
    this.resultSubscribeList = []
  }

  resultTypeNotification(result) {
    for (const f of this.resultSubscribeList) {
      f(result)
    }
  }

  subscribeSubResults(f) {
    this.resultSubscribeList.push(f)
  }

  /**
   * The purpose of this method is to create a javascript class from a parameter name
   * @param {*} parameterName
   * @param {*} content
   * @param {*} castMapping
   * @returns
   */
  factory (parameterName, content, castMapping) {
    if (typeof content === 'object' && Array !== content.constructor) {

      if (content.dataType === 'ExtensionObject') {
        content = content.value
      }
      // If the model itself provides a typecasting, then use it
      if (castMapping) {
        for (const name of Object.entries(castMapping)) {
          if (parameterName.toLowerCase() === name[0].toLowerCase()) {
            if ((content.ResultMetaData && content.ResultContent) || 
                (content.Value?.ResultMetaData && content.Value?.ResultContent)) { // We got a result
                const classification = content.ResultMetaData?.Classification ||
                  content.Value?.ResultMetaData?.Classification
                switch (classification) {
                  case "4": 
                    return new JobDataModel(content, this)
                  case "3": 
                    return new BatchDataModel(content, this)
                  case "1": 
                    return new TighteningDataType(content, this)
                  default:
                    return new ResultDataType(content, this)
                 }
            } else { // Some non-result data structure
              return eval('new ' + name[1] + '(content,this)') // eslint-disable-line
            }
          }
        }
      }
      // Else, handle simple types
      if (content && content.Locale) {
        // const a = {}
        // a[parameterName] = content.text
        return new LocalizationModel(content, this)
      } else if (content && (
          content.pythonclass === 'NodeId' || 
          content.pythonclass === 'QualifiedName')) {
        return new NodeId(content, this)
      } else if (content && content.key) {
        const a = {}
        if (!content.value) {
          content.value = ''
        }
        a[content.key] = content.value
        return new LocalizationModel(a, this)
      } else {
        // console.log('Factory: '+parameterName)
        return new IJTBaseModel(content, this, castMapping)
      }

    }
    return content
  }

  /**
   * This method handles the top level interpretation of a message that should be
   * converted to a model. 
   * @param {*} msg
   * @returns
   */
  createModelFromEvent (msg) {
    let model
    switch (msg.EventType.Identifier) {
      case ('1006'):
        model = new JoiningSystemEventModel(msg, this)
        break
      case ('1007'):
        model = new JoiningSystemResultReadyEvent(msg, this)
        break
      default:
        model = new DefaultNode(msg, this)
    }
    return model
  }
  /**
   * This method handles the top level interpretation of a message that should be
   * converted to a model. 
   * @param {*} values
   * @returns
   */
  createModelFromRead (values) {
    if (values.ResultMetaData) {
      return new ResultDataType(values, this)
     }
  }

  /**
   * This method handles the top level interpretation of a node that should be
   * converted to a model. This is probably unnecessary and could likely
   * be handled by the factory function with little modifications.
   * @param {*} node
   * @returns
   */
  createModelFromNode (node) {
    // console.log(node.nodeId)
    // console.log(node.typeName)
    let model
    switch (node.typeDefinition) {
      case ('TighteningSystemType'):
        model = new DefaultNode(node, this)
        break
      case ('ResultManagementType'):
        model = new DefaultNode(node, this)
        break
      case ('ns=4;i=2001'):
        model = new ResultDataType(node.value.value, this)
        break
      default:
        model = new DefaultNode(node, this)
    }
    node.model = model
    return model
  }
}