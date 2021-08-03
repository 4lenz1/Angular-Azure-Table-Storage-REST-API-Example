import { Component } from '@angular/core';
// import { HmacSHA256, SHA256 , enc} from 'crypto-js';
import * as cryptoJS from 'crypto-js';
import { AzureTableStorageService } from './azure-table-storage.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'test';
  tableName = 'PackAM48675200715013';
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
    const filter: { partitionKey: string, rowKey: string } = {
      partitionKey: '10s',
      rowKey: '1611590681'
    };


    this.azureTableStorageService
      .queryEntitiesWithPartitionKeyAndRowKey(this.tableName, filter)
      .subscribe(response => {
        console.log('queryEntites', response);
      }, err => console.error('error on queryEntites', err));
  }

  onQueryEntitiesWithFilterAndSelect() {
    // query entites with filter
    const filter: string = '(Rowkey ge 1611590861)';

    const select: string[] = ['PartitionKey', 'RowKey', 'Data', 'Version'];

    this.azureTableStorageService
      .queryEntitiesWithFilterAndSelect(this.tableName, filter, select.join())
      .subscribe(response => {
        console.log('queryEntites', response);
      }, err => console.error('error on queryEntites', err));
  }

}


