import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Injectable, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
// import { HmacSHA256, SHA256 , enc} from 'crypto-js';

import * as cryptoJS from 'crypto-js';
import credential  from "../crediental.json";
@Injectable({
  providedIn: 'root'
})
export class AzureTableStorageService {

  constructor(private http: HttpClient) { }

  private accountName: string = credential.accountName;
  //private accesskey: string = 'g3Vqc8H6I2MU2PXODy3CHpOjq6ho3TlGjuxJJq93bu5RGP61xSb2mZFT41W5zdPTM/GBPmzpRuQ8ZVCOgq4cOw==';
  private accesskey: string = credential.accesskey;

  private tableEndPoint: string = `https://${this.accountName}.table.core.windows.net/Tables`;
  private entitiesEndpoint: string = `https://${this.accountName}.table.core.windows.net/`;

  createTable(tableName: string): Observable<any> {
    // set http options
    const httpOptions: {} = { headers: this.generateHeader('Tables') };

    return this.http.post<any>(this.tableEndPoint, JSON.stringify({ "TableName": tableName }), httpOptions);
  }

  // list all table under storage account
  queryTable(): Observable<any> {
    const httpOptions: {} = { headers: this.generateHeader('Tables') };

    return this.http.get(this.tableEndPoint, httpOptions);
  }
  // delete table
  deleteTable(tableName: string): Observable<any> {
    const operator: string = `Tables('${tableName}')`
    const httpOptions: {} = { headers: this.generateHeader(operator) };

    return this.http.delete(`${this.tableEndPoint}('${tableName}')`, httpOptions);
  }
  // query row with partitionKey and rowKey
  queryEntitiesWithPartitionKeyAndRowKey(tableName: string, filter: { partitionKey: string, rowKey: string }): Observable<any> {
    const queryString = `(PartitionKey='${filter.partitionKey}',RowKey='${filter.rowKey}')`;
    return this.queryEntities(tableName, queryString);
  }

  queryEntitiesWithFilterAndSelect(tableName: string, filter: string, select: string): Observable<any> {
    ///myaccount/Customers()?$filter=(Rating%20ge%203)%20and%20(Rating%20le%206)&$select=PartitionKey,RowKey,Address,CustomerSince
    const queryString: string = `?$filter=${filter}&$select=${select}`;
    return this.queryEntities(tableName + '()', queryString);
  }

  private queryEntities(tableName: string, queryString: string): Observable<any> {
    const operator: string = `${tableName}${queryString}`;
    const httpOptions: {} = { headers: this.generateHeader(operator) };
    return this.http.get<any>(`${this.entitiesEndpoint}${tableName}${queryString}`, httpOptions);
  }

  private generateAuthorization(operator: string): string {
    return `SharedKeyLite ${this.accountName}:${this.generateSignature(operator)}`;
  }
  private generateSignature(operator: string): string {

    // StringToSign = Date + "\n" + CanonicalizedResource
    const date: string = new Date().toUTCString();
    const canonicalizedResource: string = '/' + this.accountName + '/' + operator;
    const stringToSign: string = date + '\n' + canonicalizedResource;

    //Signature= Base64(HMAC-SHA256(UTF8(StringToSign),Base64.decode(<your_azure_storage_account_shared_key>)))
    const secret: string = cryptoJS.enc.Base64.parse(this.accesskey);
    const hash: string = cryptoJS.HmacSHA256(stringToSign, secret);
    const hashInBase64: string = cryptoJS.enc.Base64.stringify(hash);

    return hashInBase64;
  }

  // generate header
  private generateHeader(operator: string): HttpHeaders {
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
