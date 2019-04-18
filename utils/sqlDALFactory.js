const sql = require('mssql');
class SqlDAL{
     
    constructor(sql,pool,transaction){
        this.pool =pool;
        this.sql = sql;
        this.transOwner = false;
        this.transaction = transaction;
    }
    closeConnection(){
        if(this.transaction==null){
            return this.sql.close();
        }

        if(this.transOwner==true && this.transaction)
            this.sql.close();
    }
    getDbRequest(){
        if(this.transaction!=null)
            return this.transaction.request();
        return this.pool.request()
    }
    getDataAsync(request,sqlString){
        return new Promise((resolve,reject)=>{
            request.query(sqlString, (err, rslt)=> {

                if (err) {
                    return reject(err);
                }   
    
                return resolve(rslt.recordset);
    
            });
        })
    }
    performUpdate(request,sqlString){
        return new Promise((resolve,reject)=>{
            request.query(sqlString, (err, rslt)=> {

                if (err) {
                    return reject(err);
                }   
    
                return resolve(rslt.rowsAffected[0]);
    
            });
        })
    }
    commitTrans(){
        return new Promise((resolve,reject)=>{
            this.transaction.commit(err => {
                if(err){
                    return reject(err);
                }
                this.transOwner = false;
                this.transaction = null;
                return resolve(this);
            });
        });
    }
    rollbackTrans(){
        return new Promise((resolve,reject)=>{
            if(this.transaction!=null){
                this.transaction.rollback(err => {
                    if(err){
                        return reject(err);
                    }
                    this.transOwner = false;
                    this.transaction = null;
                    return resolve();
                });
            }
            return resolve();
        });
    }
    getTransaction(){
        return this.transaction;
    }
    getPool(){
        return this.pool;
    }
    beginTransaction(){
        
        return new Promise((resolve,reject)=>{
            const transaction = new sql.Transaction(this.pool);
            transaction.begin(err => {
                if(err){
                    return reject(err);
                }
                this.transOwner  = true;
                this.transaction = transaction;
                return resolve(this);
            });
        })

    }
}

class SqlDALFactory
{
    static initDAL (sqlConfig,transDAL){
        return new Promise((resolve,reject)=>{
            let trans= null;
            if(transDAL!=null){
                console.info('sqlDAL: Creating DAL on the basis of existing DAL')
                return resolve(new SqlDAL(sql,transDAL.getPool(),transDAL.getTransaction()) );
            }

            if(sqlConfig==null){
                return reject('No connection config provided')
            }

            if(typeof  sqlConfig =='string')
            {

                // let connParts = sqlConfig.split('://');
                // let significantParts = connParts[1].split('@');
                // let userName = significantParts[0].split(':')[0]
                // let password = significantParts[0].split(':')[1]
                // let serverInfo = significantParts[1].split('?')[0];
                // let serverName = serverInfo.split('\\')[0];
                // let dbName = serverInfo.split('\\')[1];
                // {
                //     user: userName,
                //     password,
                //     server:serverName,
                //     database:dbName,
                //     options:{
                //         appName:'sdsdsd'
                //     }
                // }
                new sql.ConnectionPool(sqlConfig).connect()
                .then(pool => {                    
                    resolve(new SqlDAL(sql,pool,trans));
                }).catch(err => {
                    console.error('sqlDAL: Successfully failed to connect to SQL Server')
                    reject(err);
                })
            }
            else{
                sqlConfig.then((configData)=>{
                    new sqsql.ConnectionPool(sqlConfig).connect().then(pool => {
                        console.info('sqlDAL: Successfully connected to SQL Server')
                        resolve(new SqlDAL(sql,pool,trans));
                    }).catch(err => {
                        reject(err);
                    })
                },(ex)=>{
                    console.log('initDAL failed',ex)
                    reject(ex);    
                })
            }
            
            

        });
    }


    
}

module.exports = SqlDALFactory;