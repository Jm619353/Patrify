import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BackendService } from 'src/app/service/backend.service';

@Component({
  selector: 'app-userpage',
  templateUrl: './userpage.component.html',
  styleUrls: ['./userpage.component.css']
})
export class UserpageComponent implements OnInit {
  userInfo: any[] = [];
  token: string | null = null;

  constructor(private http: HttpClient,
    private BackendService: BackendService
  ) { }


  ngOnInit(): void {
    this.token = localStorage.getItem('token');
    if (this.token){
    this.BackendService.getUserInfo(this.token).subscribe(
      (data) => {
        
        this.userInfo = data.patrimonios;
        console.log(data.patrimonios);
      },
      (error) => {
        console.error('Erro ao buscar informações do usuário', error);
      }
    );
  }}
}