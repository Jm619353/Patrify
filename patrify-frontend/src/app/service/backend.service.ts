import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  constructor(private http: HttpClient) { }

  url = 'https://patrify-backend.vercel.app'
  // url = 'http://localhost:3000'

  registerUser(userData: any) {
    const urlregister = `${this.url}/register/registeruser`;
    return this.http.post(urlregister, userData)
      .pipe(
        map(response => {
          // Handle successful registration (e.g., return success message or user data)
          return response;
        }),
        catchError(error => {
          // Handle registration errors (e.g., return error message or throw exception)
          return throwError(error);
        })
      );
  }

  LoginUser(userData: any){
    const urllogin = `${this.url}/auth/login`;
    return this.http.post<any>(urllogin, userData)
      .pipe(
        map(response => {
          // Handle successful registration (e.g., return success message or user data)
          return response;
        }),
        catchError(error => {
          // Handle registration errors (e.g., return error message or throw exception)
          return throwError(error);
        })
      );
  }

  getUserInfo(token: string) {
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    
    const url = `${this.url}/user/profile`; 
    return this.http.get<any>(url, { headers });
  }
 
  SignedUser(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const url = `${this.url}/auth/signed`;
    
    return this.http.get(url, { headers })
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      );
  }


  updatePassword(userData: any){
    const url = `${this.url}/password-recovery`;
    return this.http.post(url, userData)
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      );
  }

  
  ChangePassword(userData: any){
    const url = `${this.url}/reset-password`;
    return this.http.post(url, userData)
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      );
  }

  cadastrarPatrimonio(patrimonioData: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const url = `${this.url}/patrimony/registerpatrimonio`;
    return this.http.post(url, patrimonioData, { headers })
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      );
  }

  listPatry(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const url = `${this.url}/patrimony/list`;
    
    return this.http.get(url, { headers })
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      );
  }


  
  patrimage(image: File | any, id: number, token: string) {
    const urlRegister = `${this.url}/patrimony/image/${id}`;
    
    const formData = new FormData();
    formData.append('image', image);
    console.log(formData);

    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    

    return this.http.post(urlRegister, formData, {headers})
      .pipe(
        map(response => {
          // Handle successful registration (e.g., return success message or user data)
          return response;
        }),
        catchError(error => {
          // Handle registration errors (e.g., return error message or throw exception)
          return throwError(error);
        })
      );
  }


  
  Filter(FilterData: any, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });
    const url = `${this.url}/patrimony/filter`;
    return this.http.put(url, FilterData, { headers })
      .pipe(
        catchError(error => {
          return throwError(error);
        })
      );
  }

  localDescarte(localData: any) {
    const urlregister = `${this.url}/descarte/listlocais`;
    
    return this.http.post(urlregister, localData)
      .pipe(
        catchError(error => throwError(error)) // Or handle errors as needed
      );
  }
  

  // GUI EDIT
  salvarEdicaoDoPatrimonio(dadosPatrimonio: any, patrimonioID: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const url = `${this.url}/patrimony/update/${patrimonioID}`;

    return this.http.put(url, dadosPatrimonio, { headers }).pipe(
      catchError(error => {
        // Lidar com erros da atualização do patrimônio
        return throwError(error);
      })
    );
  }

  deletarPatrimonio(patrimonioID: string, token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `${token}`
    });

    const url = `${this.url}/patrimony/delete/${patrimonioID}`;
    return this.http.delete(url, { headers }).pipe(
      catchError(error => {
        return throwError(error);
      })
    );
  }

}
