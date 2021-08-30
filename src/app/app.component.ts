import { Component } from '@angular/core';
import { AzureTableStorageService } from './azure-table-storage.service';
import rowKeyAndPartitionKeyModel from './rowKeyAndPartitionKey.model';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'test';
  tableName = 'PackAM48675200715013';
  lastPayload: {} = null;
  testTableName = 'myTable';
  constructor(private azureTableStorageService: AzureTableStorageService) { }

  ngOnInit(): void {
  }

  onListTableClick(): void {
    // list table
    this.azureTableStorageService.queryTable().subscribe(data => {
      console.log(data);
    });
  }
  onCreateTableClick(): void {
    // create
    this.azureTableStorageService.createTable('myTable').subscribe(
      (response: any) => {
        console.log('post response', response);
      },
      (err: any) => {
        console.error('error caught when create table')

        // table already created
        if (err.error['odata.error'].code === 'TableAlreadyExists') {
          console.log('TableAlreadyExists');
        }
      }
    );
  }

  //delete table
  onDeleteTableClick(): void {
    // test table : myTable
    this.azureTableStorageService.deleteTable('myTable').subscribe((response) => {
      console.log(response);
    },
      err => console.error('error on delete table', err));
  }

  onQueryEntitiesClick(): void {
    // query entites
    const filter: rowKeyAndPartitionKeyModel = {
      PartitionKey: '10s',
      RowKey: '1611590681'
    };


    this.azureTableStorageService
      .queryEntitiesWithPartitionKeyAndRowKey(this.tableName, filter)
      .subscribe(response => {
        console.log('queryEntites', response);
      }, err => console.error('error on queryEntites', err));
  }

  onQueryEntitiesWithFilterAndSelectClick() {
    // query entites with filter
    const filter: string = `(Rowkey eq '1611590281' and PartitionKey eq '10s')`;

    const select: string[] = ['PartitionKey', 'RowKey', 'Data', 'Version'];

    this.azureTableStorageService
      .queryEntitiesWithFilterAndSelect(this.tableName, filter, select.join())
      .subscribe(response => {
        console.log('queryEntites', response);
      }, err => console.error('error on queryEntites', err));
  }


  onInsertEntityClick() {


    const payload = this.generatePayload();
    this.azureTableStorageService
      .insertEntity(this.testTableName, payload)
      .subscribe(response => {
        console.log('entities inserted', response);
        this.setLastEntity(response);
      }
        , err => {
          console.error('error on insertEntity', err);
          // CANNOT find table
          if (err.error['odata.error'].code === 'TableNotFound') {
            console.log(`cannot insert eneity , please create table named ${this.testTableName} first`);
          }
        });
  }

  onDeleteEntityClick() {
    if (!this.lastPayload) {
      return;
    }
    const lastPayload = this.getLastEntity();
    const filter: rowKeyAndPartitionKeyModel = {
      RowKey: lastPayload['RowKey'],
      PartitionKey: lastPayload['PartitionKey'].toString(),
    }
    this.azureTableStorageService.deleteEntity(this.testTableName, filter)
      .subscribe(
        response => {
          console.log(response);
          this.setLastEntity(null);
        }
        , err => console.error('error on deleteEntity')
      );
  }

  private setLastEntity(payload: {} | null): void {
    console.log('set the lastest entity');
    this.lastPayload = payload;
  }

  private getLastEntity(): {} {
    console.log('get the lastest entity');
    return this.lastPayload;
  }

  private generatePayload(): {} {
    const rowkey: string = Math.floor(Math.random() * 1000).toString();
    const payload: {} = {
      // copy from https://docs.microsoft.com/en-us/rest/api/storageservices/insert-entity
      'Address': 'Mountain View',
      'Age': 23,
      'AmountDue': 200.23,
      'CustomerCode@odata.type': 'Edm.Guid',
      'CustomerCode': 'c9da6455-213d-42c9-9a79-3e9149a57833',
      'CustomerSince@odata.type': 'Edm.DateTime',
      'CustomerSince': '2008-07-10T00:00:00',
      'IsActive': true,
      'NumberOfOrders@odata.type': 'Edm.Int64',
      'NumberOfOrders': '255',
      'PartitionKey': 'mypartitionkey',
      'RowKey': rowkey,
    };

    return payload;
  }

}


