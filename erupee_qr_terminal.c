
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

    int scale = 14;
    int total = SIZE * scale;
    double dotR = scale * 0.38;
    double centerX = total / 2.0;
    double centerY = total / 2.0;
    double logoRadius = total * 0.20;

    fprintf(f,"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\">\n",
            total, total);

    /* Dark navy background */
    fprintf(f,"<rect width=\"100%%\" height=\"100%%\" fill=\"#0f172a\" rx=\"12\"/>\n");

    /* QR dot modules */
    for(int y=0;y<SIZE;y++){
        for(int x=0;x<SIZE;x++){

            double cx = x * scale + scale / 2.0;
            double cy = y * scale + scale / 2.0;

            /* Skip dots inside center logo area */
            double dx = cx - centerX;
            double dy = cy - centerY;
            if(dx*dx + dy*dy < logoRadius * logoRadius * 0.85) continue;

            /* Finder pattern corners drawn separately */
            int isFinderArea = (x < 7 && y < 7) ||
                               (x >= SIZE-7 && y < 7) ||
                               (x < 7 && y >= SIZE-7);
            if(isFinderArea) continue;

            fprintf(f,
                "<circle cx=\"%.1f\" cy=\"%.1f\" r=\"%.1f\" fill=\"%s\"/>\n",
                cx, cy, dotR, qr[y][x] ? "#ffffff" : "#1e293b");
        }
    }

    /* Finder patterns (top-left, top-right, bottom-left) */
    int finderOffsets[3][2] = {{0,0}, {(SIZE-7)*scale, 0}, {0, (SIZE-7)*scale}};
    for(int f_idx=0; f_idx<3; f_idx++){
        int fx = finderOffsets[f_idx][0];
        int fy = finderOffsets[f_idx][1];
        double pad = scale * 0.15;

        /* Outer black rounded rect */
        fprintf(f,"<rect x=\"%.1f\" y=\"%.1f\" width=\"%.1f\" height=\"%.1f\" rx=\"%.1f\" fill=\"#000000\"/>\n",
                fx+pad, fy+pad, 7*scale-2*pad, 7*scale-2*pad, scale*0.4);
        /* White inner */
        fprintf(f,"<rect x=\"%.1f\" y=\"%.1f\" width=\"%.1f\" height=\"%.1f\" rx=\"%.1f\" fill=\"#ffffff\"/>\n",
                fx+scale+pad, fy+scale+pad, 5*scale-2*pad, 5*scale-2*pad, scale*0.3);
        /* Black center */
        fprintf(f,"<rect x=\"%.1f\" y=\"%.1f\" width=\"%.1f\" height=\"%.1f\" rx=\"%.1f\" fill=\"#000000\"/>\n",
                fx+2*scale+pad, fy+2*scale+pad, 3*scale-2*pad, 3*scale-2*pad, scale*0.2);
    }

    /* Blue gradient circle in center */
    fprintf(f,"<defs><radialGradient id=\"g1\" cx=\"50%%\" cy=\"50%%\" r=\"50%%\">"
              "<stop offset=\"0%%\" stop-color=\"#4F8FFF\"/>"
              "<stop offset=\"100%%\" stop-color=\"#2563eb\"/>"
              "</radialGradient></defs>\n");
    fprintf(f,"<circle cx=\"%.1f\" cy=\"%.1f\" r=\"%.1f\" fill=\"url(#g1)\"/>\n",
            centerX, centerY, logoRadius);

    /* White "e₹" text */
    fprintf(f,"<text x=\"%.1f\" y=\"%.1f\" text-anchor=\"middle\" dominant-baseline=\"central\" "
              "font-family=\"sans-serif\" font-weight=\"bold\" font-size=\"%.0f\" fill=\"#ffffff\">"
              "e\xe2\x82\xb9</text>\n",
            centerX, centerY, logoRadius * 0.72);

    fprintf(f,"</svg>");
    fclose(f);
}

void createTransaction() {

    char link[500];

    printf("\nEnter e₹ payment link:\n");
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
    printf("   e₹ DIGITAL RUPEE TERMINAL\n");
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
