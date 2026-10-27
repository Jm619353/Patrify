import { Component, ElementRef, OnInit } from '@angular/core';
import { BackendService } from 'src/app/service/backend.service';
import { Router } from '@angular/router';
import axios from 'axios';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';

@Component({
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {

  token: string | null = null;
  textos: string[] = ["Gerencie", "Aprimore", "Proteja"];
  textoAtual: number = 0;
  i: number = 0;
  spanTexto!: HTMLElement; // Usando ! para indicar que spanTexto não será nulo
  errorMessage: string | null = null;
  passwordInput: HTMLInputElement | null = null;
  constructor(private elementRef: ElementRef, private router: Router, private backendService: BackendService, private http: HttpClient, private toastr: ToastrService) { }

  ngOnInit(): void {

    const eyeIcon = document.getElementById('eyeIcon');
    

    
    eyeIcon?.addEventListener('click', function () {
      // const passwordInput = document.getElementsByClassName('input-login');
      const eyeIcon = document.getElementById("eyeIcon");
      const passwordField = document.getElementById("password");
  
      if (passwordField instanceof HTMLInputElement) {
        if (passwordField.type === "password") {
            // Se o tipo for 'password', muda para 'text' para revelar a senha
            passwordField.type = "text";// Altera o ícone para o olho aberto
            eyeIcon!.innerHTML = `<path d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1c3.3 7.9 3.3 16.7 0 24.6c-14.9 35.7-46.2 87.7-93 131.1C433.5 443.2 368.8 480 288 480s-145.5-36.8-192.6-80.6C48.6 356 17.3 304 2.5 268.3c-3.3-7.9-3.3-16.7 0-24.6C17.3 208 48.6 156 95.4 112.6zM288 336c44.2 0 80-35.8 80-80s-35.8-80-80-80c-.7 0-1.3 0-2 0c1.3 5.1 2 10.5 2 16c0 35.3-28.7 64-64 64c-5.5 0-10.9-.7-16-2c0 .7 0 1.3 0 2c0 44.2 35.8 80 80 80zm0-208a128 128 0 1 1 0 256 128 128 0 1 1 0-256z"/>`;
          } else {
            // Se o tipo for 'text', muda para 'password' para ocultar a senha
            passwordField.type = "password";// Altera o ícone para o olho fechado
        eyeIcon!.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zm151 118.3C226 97.7 269.5 80 320 80c65.2 0 118.8 29.6 159.9 67.7C518.4 183.5 545 226 558.6 256c-12.6 28-36.6 66.8-70.9 100.9l-53.8-42.2c9.1-17.6 14.2-37.5 14.2-58.7c0-70.7-57.3-128-128-128c-32.2 0-61.7 11.9-84.2 31.5l-46.1-36.1zM394.9 284.2l-81.5-63.9c4.2-8.5 6.6-18.2 6.6-28.3c0-5.5-.7-10.9-2-16c.7 0 1.3 0 2 0c44.2 0 80 35.8 80 80c0 9.9-1.8 19.4-5.1 28.2zm51.3 163.3l-41.9-33C378.8 425.4 350.7 432 320 432c-65.2 0-118.8-29.6-159.9-67.7C121.6 328.5 95 286 81.4 256c8.3-18.4 21.5-41.5 39.4-64.8L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5zm-88-69.3L302 334c-23.5-5.4-43.1-21.2-53.7-42.3l-56.1-44.2c-.2 2.8-.3 5.6-.3 8.5c0 70.7 57.3 128 128 128c13.3 0 26.1-2 38.2-5.8z"/></svg>`;
      }
    } else {
        console.error("Elemento de senha não encontrado.");
    }
    });






    const passwordInput = document.getElementById('passwordreg') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        this.validarSenhaForte(passwordInput.value);
      });
    }
    this.spanTexto = this.elementRef.nativeElement.querySelector('#organize')!;
    this.iniciarLoop();
    const textLogin: HTMLElement | null = document.getElementById('linkLogin');
    const textRegistro: HTMLElement | null = document.getElementById('linkRegister');
    const loginPage: HTMLElement | null = document.querySelector('.login');
    const registerPage: HTMLElement | null = document.querySelector('.register');
    const inputLogin: NodeListOf<HTMLInputElement> | null = document.querySelectorAll('.input-login');
    this.passwordInput = document.getElementById('passwordreg') as HTMLInputElement;

    function formatCNPJ(value: string): string {
      // Remove todos os caracteres que não são dígitos
      value = value.replace(/\D/g, '');

      // Adiciona os pontos e traços no CNPJ
      if (value.length > 12) value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
      else if (value.length > 8) value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4}).*/, '$1.$2.$3/$4');
      else if (value.length > 5) value = value.replace(/(\d{2})(\d{3})(\d{3}).*/, '$1.$2.$3');
      else if (value.length > 2) value = value.replace(/(\d{2})(\d{3}).*/, '$1.$2');

      return value;
    }

    // Função para atualizar o campo de texto
    function handleInput(event: Event): void {
      const input = event.target as HTMLInputElement;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;

      input.value = formatCNPJ(input.value);

      

      // Ajusta a posição do cursor
      let newPos = start + (input.value.length - (input.value.replace(/\D/g, '').length));
      input.setSelectionRange(newPos, newPos);
    }

    // Adiciona o evento de input ao campo de texto
    const cnpjInput = document.getElementById('cnpj')
    if (cnpjInput) {
      cnpjInput.addEventListener('input', handleInput);
    }


 const cnpjInput1 = document.getElementById('cnpjreg')
    if (cnpjInput1) {
      cnpjInput1.addEventListener('input', handleInput);
    }

    if (textRegistro && loginPage && registerPage) {
      textRegistro.addEventListener('click', () => {
        loginPage.style.transform = 'translateX(-100vw)';
        registerPage.style.transform = 'translateX(0vw)';

        if (inputLogin) {
          inputLogin.forEach(input => {
            input.value = '';
          });
        }
      });
    }

    if (textLogin && loginPage && registerPage) {
      textLogin.addEventListener('click', () => {
        registerPage.style.transform = 'translateX(-100vw)';
        loginPage.style.transform = 'translateX(0vw)';

        if (inputLogin) {
          inputLogin.forEach(input => {
            input.value = '';
          });
        }
      });
    }


    this.token = localStorage.getItem('token');
    console.log('Token recuperado do localStorage:', this.token);

    // Verificar se o usuário está autenticado usando o token
    if (this.token) {

      this.backendService.SignedUser(this.token)
        .subscribe(
          response => {
            // Manipular a resposta bem-sucedida aqui (por exemplo, exibir mensagem de sucesso)
            console.log(response);
            this.router.navigate(['/inventario']);
          },
          error => {
            // Manipular erros de autenticação aqui (por exemplo, exibir mensagem de erro)
            console.error('Erro ao verificar autenticação do usuário:', error);
          }
        );
    } else {
      console.error('Token não encontrado no localStorage.');
    }


  }


  escreverTexto(): void {
    if (this.spanTexto) {
      if (this.i < this.textos[this.textoAtual].length) {
        this.spanTexto.textContent += this.textos[this.textoAtual].charAt(this.i);
        this.i++;
        setTimeout(() => this.escreverTexto(), 100); // Ajuste o valor do timeout para controlar a velocidade da digitação
      } else {
        setTimeout(() => this.apagarTexto(), 1000); // Aguarda 1 segundo e depois inicia a função para apagar o texto
      }
    }
  }

  apagarTexto(): void {
    if (this.spanTexto) {
      const textoAtualString: string = this.textos[this.textoAtual];
      this.i = textoAtualString.length;
      const interval = setInterval(() => {
        if (this.spanTexto) {
          if (this.i >= 0) {
            this.spanTexto.textContent = textoAtualString.slice(0, this.i);
            this.i--;
          } else {
            clearInterval(interval); // Para o setInterval quando o texto foi totalmente apagado
            this.textoAtual++;
            if (this.textoAtual >= this.textos.length) {
              this.textoAtual = 0; // Reseta para o primeiro texto quando chegar ao último
            }
            setTimeout(() => this.escreverTexto(), 500); // Aguarda meio segundo e inicia a função para escrever o próximo texto
          }
        }
      }, 100);
    }
  }

  iniciarLoop(): void {
    setTimeout(() => this.escreverTexto(), 500); // Aguarda meio segundo antes de começar a escrever o primeiro texto


    const btnEsqueciSenha: HTMLElement | null = document.querySelector('#forgotPassword');
    const btnCancelarSenha: HTMLElement | null = document.querySelector('#cancel-pass');
    const containerPassword: HTMLElement | null = document.querySelector('.container-password');




    if (btnCancelarSenha !== null && containerPassword !== null) {
      btnCancelarSenha.addEventListener('click', () => {
        containerPassword.style.display = 'none';
        const inputLoginFowardPass: NodeListOf<HTMLInputElement> = document.querySelectorAll('.input-fowardpass');
        inputLoginFowardPass.forEach(input => {
          input.value = '';
        });
      });
    }



    if (btnEsqueciSenha !== null && containerPassword !== null) {
      btnEsqueciSenha.addEventListener('click', () => {
        containerPassword.style.display = 'flex';
      });
    }

  }
  
  removeNonNumericCharacters(value: string): string {
    // Remove todos os caracteres que não são dígitos
    return value.replace(/[.\-\/]/g, '');
  }

  LoginUser() {
    const form = document.getElementById('formLogin') as HTMLFormElement;
    const cnpj = form.elements.namedItem('cnpj') as HTMLInputElement;
    const password = form.elements.namedItem('password') as HTMLInputElement;

    const cnpjFormat = this.removeNonNumericCharacters(cnpj.value);
    console.log(cnpjFormat);
    
    const loginData = {
      cnpj: cnpjFormat,
      password: password.value
    };

    

    console.log(loginData)

    this.backendService.LoginUser(loginData)
      .subscribe(
        response => {
          // console.log('Usuário logado com sucesso:', response);
          const token = response.token;
          if (token) {
            localStorage.setItem('token', token);
            this.router.navigate(['/home']);
          } else {
            console.error('Token não encontrado na resposta.');
          }
        },
        error => {
          // Manipular erros de registro aqui (por exemplo, exibir mensagem de erro)
          console.error('Erro ao logar usuário:', error);
        }
      );
  }

  async registerUser() {
    const form = document.getElementById('formRegister') as HTMLFormElement;
    if (!form) {
      console.error("Formulário não encontrado.");
      return;
    }

    const cnpj = form.elements.namedItem('cnpjreg') as HTMLInputElement;
    const email = form.elements.namedItem('email') as HTMLInputElement | null;
    const password = form.elements.namedItem('passwordreg') as HTMLInputElement | null;
    const reppassword = form.elements.namedItem('reppassword') as HTMLInputElement | null;

    const cnpjFormat = this.removeNonNumericCharacters(cnpj.value);
    console.log(cnpjFormat);


    // Valide os campos do formulário
    if (!cnpj || !cnpj.value) {
      this.errorMessage = 'Por favor, informe um CNPJ.';
      return;
    } else if (!email || !email.value) {
      this.errorMessage = 'Por favor, informe um e-mail.';
      return;
    } else if (!this.validateEmail(email.value)) {
      console.error('E-mail inválido.');
      return;
    } else if (!password || !password.value) {
      this.errorMessage = 'Por favor, informe uma senha.';
      return;
    } else if (!reppassword || !reppassword.value) {
      this.errorMessage = 'Por favor, repita a senha correta';
      return;
    }

    // Verifique se as senhas coincidem
    if (password.value !== reppassword.value) {
      this.errorMessage = 'As senhas não coincidem.';
      return;
    }

    // Verifique se o CNPJ já existe
    if (!await this.checkCNPJExists(cnpjFormat)) {
      this.errorMessage = 'Erro ao verificar CNPJ. Por favor, tente novamente mais tarde.';
      return;
    }

    // Se todas as verificações passarem, limpe a mensagem de erro
    this.errorMessage = '';

    if (await this.checkCNPJExists(cnpjFormat)) {
      // Fazendo requisição à API do BrasilAPI para obter informações da empresa pelo CNPJ
      axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpjFormat}`)
        .then(response => {
          const dadosCNPJ = response.data;

          // Construindo os dados do usuário com base nos dados da empresa retornados pela API
          const userData = {
            name: dadosCNPJ.nome_fantasia,
            cnpj: cnpjFormat,
            telefone1: dadosCNPJ.ddd_telefone_1,
            telefone2: dadosCNPJ.ddd_telefone_2,
            email: email.value,
            razaoSocial: dadosCNPJ.razao_social,
            atividadeEconomica: dadosCNPJ.cnae_fiscal_descricao,
            endereco: `${dadosCNPJ.descricao_tipo_de_logradouro} ${dadosCNPJ.logradouro} Nº ${dadosCNPJ.numero}, ${dadosCNPJ.bairro}, ${dadosCNPJ.municipio} - ${dadosCNPJ.uf}`,
            password: password.value
          };

          // Chamando o serviço de backend para registrar o usuário
          this.backendService.registerUser(userData)
            .subscribe(
              response => {
                console.log('Usuário registrado com sucesso:', response);
                this.toastr.success( 'Usuário Registrado com sucesso, você sera redirecionado para a tela de login em 3 segundos', 'Sucesso');
        
                setTimeout(() => {
                  this.router.navigate(['/login']);
                }, 3000);
                location.reload();
              },
              error => {
                // Manipular erros de registro aqui (por exemplo, exibir mensagem de erro)
                this.toastr.error( 'Erro ao Registrar usuário', 'Erro');
        
                console.error('Erro ao registrar usuário:', error);
              }
            );
        })
        .catch(error => {
          // Trate os erros de requisição à API aqui (por exemplo, exibir mensagem de erro)
          console.error('Erro ao obter dados do CNPJ:', error);
        });

    } else {
      this.errorMessage = 'Erro ao verificar CNPJ. Por favor, tente novamente mais tarde.';
    }
  }



  // Função para validar a força da senha
  validarSenhaForte(senha: string): void {
    const progressElement = document.getElementById('passwordStrength');
    const btnCadastro = document.getElementById('btnCadastro');

    if (!progressElement || !btnCadastro) return;

    // Verificar a força da senha
    let strength = 0;

    // Adicionar pontos baseados em critérios de senha
    strength += senha.length >= 12 ? 1 : 0;
    strength += /[a-z]/.test(senha) ? 1 : 0; // Lowercase letters
    strength += /[A-Z]/.test(senha) ? 1 : 0; // Uppercase letters
    strength += /\d/.test(senha) ? 1 : 0;     // Digits
    strength += /[^A-Za-z0-9]/.test(senha) ? 1 : 0; // Special characters

    // Atualizar a largura da barra de progresso com base na força da senha
    const progressWidth = (strength / 5) * 100; // Assuming 5 points for maximum strength
    progressElement.style.width = progressWidth + '%';

    // Definir a cor da barra de progresso com base na força da senha
    if (progressWidth < 40) {
      progressElement.classList.remove('bg-warning', 'bg-success');
      progressElement.classList.add('bg-danger');
      btnCadastro.setAttribute('disabled', 'true');
    } else if (progressWidth < 80) {
      progressElement.classList.remove('bg-danger', 'bg-success');
      progressElement.classList.add('bg-warning');
      btnCadastro.setAttribute('disabled', 'true');
    } else {
      progressElement.classList.remove('bg-danger', 'bg-warning');
      progressElement.classList.add('bg-success');
      btnCadastro.removeAttribute('disabled');
    }
  }



  // Function to validate CNPJ format (basic check, can be improved)
  validateCNPJ(cnpj: string): boolean {
    const cnpjLength = cnpj.length;
    return cnpjLength === 14 && /^[0-9]+$/.test(cnpj);
  }

  // Function to validate email format (basic check)
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async checkCNPJExists(cnpj: string): Promise<boolean> {
    try {
      const cnpjVerification = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      return !!cnpjVerification.data; // Convert response.data to boolean
    } catch (error) {
      console.error('Erro ao verificar CNPJ:', error);
      return false; // CNPJ not found or error occurred
    }
  }

}      
