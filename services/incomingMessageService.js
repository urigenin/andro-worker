class IncomingMessageService{
    constructor(sqlDal,logger){
        this.sqlDal = sqlDal;
        this.logger = logger;
    }

    async addMessage(messageData){
        let sql  =`INSERT INTO [dbo].[IncomingMessage]
        ([deviceUID]
        ,dataConsumerId
        ,[recieveDate],[payload])
        VALUES (@deviceUID,@dataConsumerId,@recieveDate,@messageTypeId,@payload)`
        let request = this.sqlDal.getDbRequest();
        request.input('deviceUID',messageData.deviceUID)
        request.input('dataConsumerId',messageData.dataConsumerId)
        request.input('messageTypeId',messageData.messageTypeId)
        request.input('recieveDate',messageData.recieveDate);
        request.input('payload',JSON.stringify( messageData.payload));
        return await this.sqlDal.getDataAsync(request,sql);
    }
}
module.exports = IncomingMessageService;