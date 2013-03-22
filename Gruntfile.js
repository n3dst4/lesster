/*
 * This is a grunt file. It specifies all the build steps we can execute for
 * this project. See http://gruntjs.com/
 */
module.exports = function (grunt) {
    
    // config
    grunt.initConfig({
        // load in our package defs
        pkg: grunt.file.readJSON("package.json"),
        
        // precompile LESS
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
        
        // turn JADE templates into html (we don't use JADE at request-time )
        jade: {
            options: {
                pretty: true
            },
            foo: {
                files: {
                    "static/pages/email-verification-succeeded.html": "assets/pages/email-verification-succeeded.jade",
                    "static/pages/email-verification-failed.html": "assets/pages/email-verification-failed.jade",
                    "static/pages/index.html": "assets/pages/index.jade",
                    "views/account.hbs": "assets/pages/account.jade"
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
        },
        watch: {
            less: {
                files: ['assets/**/*.less'],
                tasks: ['less'],
                options: {
                    nospawn: true
                }
            },
            jade: {
                files: ['assets/**/*.jade'],
                tasks: ['jade'],
                options: {
                    nospawn: true
                }
            }            
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jade');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');
    
    grunt.registerTask('default', ["less", "jade", "copy"]);
    
};