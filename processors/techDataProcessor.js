const sqlDALFactory  = require('./../utils/sqlDALFactory');
const configManager = require('./../utils/configManager');
const DeviceService = require('./../services/deviceService')
const IncomingMessageService = require('./../services/incomingMessageService') ;
const path = require('path');
const DataProcessorBase = require('./dataProcessorBase')
const {MessageTypes}  = require('./../consts');
const sqlDAL  = require('./../utils/sqlDALFactory')
const TechDataPayloadReader = require('./../messageConverters/techDataPayloadReader')
let filePath = path.join(__dirname,'./../protos/ProtoData.proto');


class TechDataProcessor extends DataProcessorBase{
    constructor(logger){
        super( logger);
    }
    async process(rowMessage){
        let dal = null;
        let me = this;
        let progresslog="0";
        try{
            let techDataPayloadReader = new TechDataPayloadReader()

            let msgProcessed  = await techDataPayloadReader.readMessage(filePath,rowMessage,this.logger)


            dal = await sqlDAL.initDAL(configManager.getSQLConfig());
            
            let deviceService = new DeviceService(dal,this.logger);
            let consumerData = await deviceService.getDeviceConsumer(msgProcessed.devUid);
            if(consumerData!=null){
                let dataForStore = {
                    deviceUID:consumerData.deviceUID,
                    dataConsumerId:consumerData.dataConsumerId,
                    messageTypeId:MessageTypes.MESSAGE_DATA_PACKET,
                  
                    recieveDate: new Date()
                };
                this.logger.info('####TechPacketProcessor####- accepted incomming message from ' + consumerData.deviceUID + ' with ts ' +msgProcessed.timeStamp  +' weight ' , msgProcessed.weightData )
            }
            else{
                this.logger.warn('####TechPacketProcessor####- No consumer found for TechData message for device ' +msgProcessed.devUid);
            }

            
        }
        catch(ex){
            me.logger.error('techData process failed ' +progresslog,ex);
           throw ex;
        }
        finally{
            if(dal)
                dal.closeConnection()
        }
    }
}
module.exports =TechDataProcessor;