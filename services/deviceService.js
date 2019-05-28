class DeviceService{
    constructor(sqlDal,logger){
        this.sqlDal = sqlDal;
        this.logger = logger;
    }

    async getDeviceConsumer(deviceUID){
        let sql  =`SELECT TOP 1 * from Device WHERE deviceUID=@deviceUID`
        let request = this.sqlDal.getDbRequest();
        request.input('deviceUID',String(deviceUID))
        let result =  await this.sqlDal.getDataAsync(request,sql);
        if (result.length==0)
            return null;
        
        return result[0];

    }
}
module.exports = DeviceService;