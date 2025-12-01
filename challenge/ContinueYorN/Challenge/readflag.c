#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
    setuid(0);
    
    clearenv();
    setenv("PATH", "/bin:/usr/bin", 1);
    
    system("/bin/echo CM{example_flag}");

    system("/bin/echo 'If you see this message, the flag has been read successfully.'");
    return 0;
}