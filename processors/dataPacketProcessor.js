const sqlDALFactory  = require('./../utils/sqlDALFactory');
const configManager = require('./../utils/configManager');
const DeviceService = require('./../services/deviceService')
const path = require('path');
const DataPacketPayloadReader = require('./../messageConverters/dataPacketPayloadReader')
let filePath = path.join(__dirname,'/protos/ProtoData.proto');

class DataPacketProcessor{
    constructor(logger){
        this.logger = logger;
    }
    process(rowMessage){
        let dal = null;
        try{
            let dataPacketPayloadReader = new DataPacketPayloadReader()

            let msgProcessed  = await dataPacketPayloadReader.readMessage(filePath,rowMessage)

            dal = await this.sqlDAL.initDAL(configManager.getSQLConfig())
            let deviceService = new DeviceService(dal,this.logger);
            let consumerData = deviceService.getDeviceConsumer(msgProcessed.devUid);
            if(consumerData!=null){

            }
            else{
                this.logger.warn('No consumer found for message for device ' +msgProcessed.devUid);
            }

            
        }
        catch(ex){
            me.logger.error('handleGetDataModelTypes failed' ,ex);
            return (Boom.badImplementation("unable to process request - Server Error"));
        }
        finally{
            dal.closeConnection()
        }
    }
}
module.exports =DataPacketProcessor;