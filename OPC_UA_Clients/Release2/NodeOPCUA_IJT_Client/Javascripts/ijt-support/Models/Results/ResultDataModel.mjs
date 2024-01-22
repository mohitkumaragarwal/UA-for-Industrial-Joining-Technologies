import IJTBaseModel from '../IJTBaseModel.mjs'

// The purpose of this class is to handle the actual subscription or reading of a value and via socketIO send the result to the webpage
export default class ResultDataModel extends IJTBaseModel {
  constructor (parameters, modelManager) {
    const castMapping = {
      ResultMetaData: 'ResultMetaData',
      ResultContent: 'ResultContent'
    }

    super(parameters, modelManager, castMapping)
  }

  get resultId () {
    return this.ResultMetaData.ResultId
  }
}
