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
        jade: {
            options: {
                pretty: true
            },
            foo: {
                files: {
                    "static/pages/index.html": "assets/pages/index.jade"
                }
            }
        },
        copy: {
            foo: {
                expand: true,
                cwd: "assets",
                src: ["**/*", "!**/*.less", "!**/*.jade"],
                dest: "static"             
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-copy');
    
    grunt.registerTask('default', ["less", "jade", "copy"]);
    
};