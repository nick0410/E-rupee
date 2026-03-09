
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define SIZE 21

void generateSimpleQR(const char *data, int qr[SIZE][SIZE]) {

    int len = strlen(data);
    int k = 0;

    for(int i=0;i<SIZE;i++){
        for(int j=0;j<SIZE;j++){

            if(k < len){
                qr[i][j] = (data[k] + i + j) % 2;
            }else{
                qr[i][j] = (i + j) % 2;
            }

            k++;
        }
    }
}

void saveQR(int qr[SIZE][SIZE]) {

    FILE *f = fopen("payment_qr.svg","w");

    int scale = 10;

    fprintf(f,"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\">\n",
            SIZE*scale,SIZE*scale);

    fprintf(f,"<rect width=\"100%%\" height=\"100%%\" fill=\"white\"/>\n");

    for(int y=0;y<SIZE;y++){
        for(int x=0;x<SIZE;x++){

            if(qr[y][x]){

                fprintf(f,
                "<rect x=\"%d\" y=\"%d\" width=\"%d\" height=\"%d\" fill=\"black\"/>\n",
                x*scale,y*scale,scale,scale);

            }
        }
    }

    fprintf(f,"</svg>");
    fclose(f);
}

void createTransaction() {

    char link[500];

    printf("\nEnter eΓé╣ payment link:\n");
    fgets(link,500,stdin);

    link[strcspn(link,"\n")] = 0;

    int qr[SIZE][SIZE];

    generateSimpleQR(link,qr);

    saveQR(qr);

    printf("\nQR Generated: payment_qr.svg\n");
    printf("Customer can scan to pay.\n");
}

int main(){

    int choice;

    printf("=================================\n");
    printf("   eΓé╣ DIGITAL RUPEE TERMINAL\n");
    printf("=================================\n");

    while(1){

        printf("\n1. Generate Payment QR\n");
        printf("2. Exit\n");
        printf("Choice: ");

        scanf("%d",&choice);
        getchar();

        if(choice==1){

            createTransaction();

        }else if(choice==2){

            printf("Terminal Closed\n");
            break;

        }else{

            printf("Invalid Option\n");
        }
    }

    return 0;
}
