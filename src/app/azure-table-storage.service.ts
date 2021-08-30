import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { WordArray } from 'crypto-js';
import * as cryptoJS from 'crypto-js';
import credential from "../../crediental.json";
import rowKeyAndPartitionKeyModel from './rowKeyAndPartitionKey.model';
@Injectable({
  providedIn: 'root'
})
export class AzureTableStorageService {

  constructor(private http: HttpClient) { }

  private accountName: string = credential.accountName;
  private accesskey: string = credential.accesskey;

  private entitiesEndpoint: string = `https://${this.accountName}.table.core.windows.net/`;
  private tableEndPoint: string = `${this.entitiesEndpoint}Tables`;


  createTable(tableName: string): Observable<any> {
    // set http options
    const httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader('Tables') };

    return this.http.post<any>(this.tableEndPoint, JSON.stringify({ "TableName": tableName }), httpOptions);
}

// list all table under storage account
queryTable(): Observable<any> {
    const httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader('Tables') };

    return this.http.get(this.tableEndPoint, httpOptions);
}
// delete table
deleteTable(tableName: string): Observable<any> {
    const operator: string = `Tables('${tableName}')`
    const httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader(operator) };

    return this.http.delete(`${this.tableEndPoint}('${tableName}')`, httpOptions);
}
// query row with partitionKey and rowKey
queryEntitiesWithPartitionKeyAndRowKey(tableName: string, filter: rowKeyAndPartitionKeyModel): Observable<any> {
    const queryString = `(PartitionKey='${filter.PartitionKey}',RowKey='${filter.RowKey}')`;
    const operator: string = `${tableName}${queryString}`;
    return this.queryEntities(tableName, queryString, operator);
}

queryEntitiesWithPartitionKey(tableName: string, partitionKey: string): Observable<any> {
    const queryString: string = `()?$filter=${partitionKey}`;

    const operator: string = `${tableName}()`;
    return this.queryEntities(tableName, queryString, operator);
}


queryEntitiesWithFilterAndSelect(tableName: string, filter: string, select: string): Observable<any> {
    ///myaccount/Customers()?$filter=(Rating%20ge%203)%20and%20(Rating%20le%206)&$select=PartitionKey,RowKey,Address,CustomerSince
    const queryString: string = `()?$filter=${filter}&$select=${select}`;
    const operator: string = `${tableName}()`;
    return this.queryEntities(tableName, queryString, operator);
}
listTopXRowEntities(tableName: string, rowNumber: number): Observable<any> {
    const httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader(tableName + '()') };

    return this.http.get<any>(`${this.entitiesEndpoint}${tableName}()?$top=${rowNumber}`, httpOptions);
}

private queryEntities(tableName: string, queryString: string, operator: string): Observable<any> {

    const httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader(operator) };

    return this.http.get<any>(`${this.entitiesEndpoint}${tableName}${queryString}`, httpOptions);
}

insertEntity(tableName: string, payload: {}): Observable<any> {
    const operator: string = `${tableName}`;
    const httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader(operator) };

    return this.http.post(`${this.entitiesEndpoint}${tableName}`, payload, httpOptions);
}

deleteEntity(tableName: string, filter: rowKeyAndPartitionKeyModel): Observable<any> {
    const queryString = `${tableName}(PartitionKey='${filter.PartitionKey}',RowKey='${filter.RowKey}')`;

    // using let because ned to update  If-Match in header
    let httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader(queryString) };
    httpOptions.headers = httpOptions.headers.set('If-Match', '*');

    return this.http.delete(`${this.entitiesEndpoint}${queryString}`, httpOptions);
}

updateEntity(tableName: string, filter: rowKeyAndPartitionKeyModel, payload: {}) {
    const queryString = `(PartitionKey='${filter.PartitionKey}',RowKey='${filter.RowKey}')`;
    const operator: string = `${tableName}${queryString}`;

    let httpOptions: { headers: HttpHeaders } = { headers: this.generateDefaultHeader(operator) };

    return this.http.put(`${this.entitiesEndpoint}${tableName}${queryString}`, payload, httpOptions);
}

mergeEntities(tableName: string, filter: string, payload: {}): Observable<any> {
    const queryString = `(RowKey='${filter}')`;
    const operator: string = `${tableName}${queryString}`;

    let options: { body: any, headers: HttpHeaders } =
    {
        headers: this.generateDefaultHeader(operator),
        body: payload
    };
    options.headers = options.headers.set('If-Match', '*');

    return this.http.request(
        'MERGE',
        `${this.entitiesEndpoint}${operator}`,
        options
    );
}

mergeEntity(tableName: string, filter: rowKeyAndPartitionKeyModel, payload: {}): Observable<any> {
    const queryString = `(PartitionKey='${filter.PartitionKey}',RowKey='${filter.RowKey}')`;
    const operator: string = `${tableName}${queryString}`;

    let options: { body: any, headers: HttpHeaders } =
    {
        headers: this.generateDefaultHeader(operator),
        body: payload
    };
    options.headers = options.headers.set('If-Match', '*');

    return this.http.request(
        'MERGE',
        `${this.entitiesEndpoint}${operator}`,
        options
    );

}

private generateAuthorization(operator: string): string {
    const token = `SharedKeyLite ${this.accountName}:${this.generateSignature(operator)}`;
    // this._authService.accessToken = token;
    return token;
}
private generateSignature(operator: string): string {

    // StringToSign = Date + "\n" + CanonicalizedResource
    const date: string = new Date().toUTCString();
    const canonicalizedResource: string = '/' + this.accountName + '/' + operator;
    const stringToSign: string = date + '\n' + canonicalizedResource;

    //Signature= Base64(HMAC-SHA256(UTF8(StringToSign),Base64.decode(<your_azure_storage_account_shared_key>)))
    const secret: string = cryptoJS.enc.Base64.parse(this.accesskey);
    const hash: WordArray = cryptoJS.HmacSHA256(stringToSign, secret);
    const hashInBase64: string = cryptoJS.enc.Base64.stringify(hash);

    return hashInBase64;
}

// generate header
private generateDefaultHeader(operator: string): HttpHeaders {

    const date = new Date().toUTCString();
    const authentication: string = this.generateAuthorization(operator);
    return new HttpHeaders({
        'x-ms-version': '2020-04-08',
        'Content-Type': 'application/json',
        'Accept': 'application/json;odata=nometadata',
        'x-ms-date': date,
        'Prefer': 'return-content',
        'Authorization': authentication,
        'DataServiceVersion': '3.0;NetFx',
        'MaxDataServiceVersion': '3.0;NetFx',
    });
}

}
