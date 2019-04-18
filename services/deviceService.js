class DeviceService{
    constructor(sqlDal,logger){
        this.sqlDal = sqlDal;
        this.logger = logger;
    }

    async getDeviceConsumer(deviceUID){
        let sql  =`SELECT * from Device WHERE deviceUID=@deviceUID`
        let request = this.sqlDal.getDbRequest();
        request.input('deviceUID',deviceUID)
        return await this.sqlDal.getDataAsync(request,sql);
    }
}
module.exports = DeviceReader;