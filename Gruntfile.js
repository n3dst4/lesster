module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        less: {
            options: {
            },
            foo: {
                expand: true,
                cwd: "assets",
                src: "**/*.less",
                dest: "static",
                ext: ".css"
            }
        },
        copy: {
            foo: {
                expand: true,
                cwd: "assets",
                src: ["**/*", "!**/*.less"],
                dest: "static"             
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    
    grunt.registerTask('default', ["less", "copy"]);
    
};