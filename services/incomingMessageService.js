class IncomingMessageService{
    constructor(sqlDal,logger){
        this.sqlDal = sqlDal;
        this.logger = logger;
    }

    async inesertMessage(messageData){
        let sql  =`INSERT INTO [dbo].[IncomingMessage]
        ([deviceUID]
        ,dataConsumerId
        ,[recieveDate]
        ,[messageTypeId]
        ,[deviceTimestamp]
        ,[battState]
        ,[rssi]
        ,[payload])
        VALUES (@deviceUID,@dataConsumerId,GETUTCDATE(),@messageTypeId,@payload)`
        let request = this.sqlDal.getDbRequest();
        request.input('deviceUID',deviceUID)
        return await this.sqlDal.getDataAsync(request,sql);
    }
}
module.exports = IncomingMessageService;