class IncomingMessageService{
    constructor(sqlDal,logger){
        this.sqlDal = sqlDal;
        this.logger = logger;
    }

    async addMessage(messageData){
        let sql  =`INSERT INTO [dbo].[IncomingMessage]
            ([deviceUID]
            ,dataConsumerId
            ,[recieveDate],messageTypeId,[payload])
        VALUES (@deviceUID,@dataConsumerId,@recieveDate,@messageTypeId,@payload);SELECT SCOPE_IDENTITY() as newId`
        let request = this.sqlDal.getDbRequest();
        request.input('deviceUID',messageData.deviceUID)
        request.input('dataConsumerId',messageData.dataConsumerId)
        request.input('messageTypeId',messageData.messageTypeId)
        request.input('recieveDate',messageData.recieveDate);

        let payloadJson = JSON.stringify( messageData.payload);
        request.input('payload',payloadJson);
        let newInfo=  await this.sqlDal.getDataAsync(request,sql);
        let newId = newInfo[0]['newId'];
        return newId;
    }
}
module.exports = IncomingMessageService;