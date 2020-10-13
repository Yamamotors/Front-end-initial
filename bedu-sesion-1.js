1 , 2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 , 10

for(var contador = 1; contador <= 10; contador++){
    if (contador >=2) {
        for(var contadorDos = 1; contadorDos <= contador; contadorDos++) {
            if(contador % contadorDos === 0) {
                contadorDeModulo += 1;
            }
        }
    }
}