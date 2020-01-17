/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/record', 'N/file','N/redirect','N/task','N/url','N/config'],
    function(serverWidget,email, runtime,record,file,redirect,task,url,config) {
        function onRequest(context) {
			try{
			
			 
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Subsidiary Import Assistance'
                });
                //Read from the global variable
				var scriptparamId = runtime.getCurrentScript().getParameter("custscript_subimporttool_folder");
				if(!scriptparamId){
					var configRecObj = config.load({ type: config.Type.COMPANY_PREFERENCES }); 
			        log.debug('configRecObj',JSON.stringify(configRecObj));
					//Create a new Folder
					 var objRecord = record.create({
				            type: record.Type.FOLDER,
				            isDynamic: true
				        });
				        objRecord.setValue({
				            fieldId: 'name',
				            value: 'SubsidiaryImport'+new Date().toISOString()
				        });
				        scriptparamId = objRecord.save({
				            enableSourcing: true,
				            ignoreMandatoryFields: true
				        });
				        scriptparamId = parseInt(scriptparamId);
				        configRecObj.setText({ fieldId: "custscript_subimporttool_folder", text: scriptparamId }); 
				        //configRecObj.save(); 
				}
				log.debug('scriptparamId',scriptparamId);
				var downloadTemp = context.request.parameters.isTemplateDownload;
				
				var upload = context.request.parameters.isUpload;
				log.debug('upload',upload);
				var flag = context.request.parameters.testflag;
				log.debug('flag',flag);
                var subsidiary_rec = record.create({
                    type: record.Type.SUBSIDIARY,
                    isDynamic: true,
                });
				
				var recordObj = record.create({
                    type: 'customrecord_subsidiary_codes',
                    isDynamic: true,
                });
				var outputDomain = url.resolveDomain({
						hostType: url.HostType.APPLICATION
						
					});
					log.debug('outputDomain',outputDomain);
                var recordFields = subsidiary_rec.getFields();
                var recordFieldIds = [];
                var recordFieldLabels = [];
				/////////////////Creation Of Field InternalIds////////////////
                var JSONobj = '{"Internal Id":"internalid","Company Code":"custrecord_companycode","Name":"name","Subsubsidiary of":"parent",';
                for (var i = 0; i < recordFields.length; i++) {

                    var field = subsidiary_rec.getField(recordFields[i]);
                    
                    if (field && field.label) {
                        recordFieldLabel = field.label;
						recordFieldLabel = recordFieldLabel.replace(',' ,'');
                        recordFieldId = field.id;
						
                        if(recordFieldLabel!= 'Name' && recordFieldLabel!= 'Subsubsidiary of' && recordFieldLabel!= 'ExternalId')
						{
							if(i<recordFields.length-1)
						JSONobj = JSONobj+JSON.stringify(recordFieldLabel)+":"+JSON.stringify(recordFieldId)+",";
					         //else
						//JSONobj = JSONobj+JSON.stringify(recordFieldLabel)+":"+JSON.stringify(recordFieldId);
                        recordFieldIds.push(recordFieldId);
                        recordFieldLabels.push(recordFieldLabel);
						}
                    }
                }
JSONobj = JSONobj+'"ATTENTION":"attention","ADDRESSEE":"addressee","PHONE":"addrphone","ADDRESS 1":"addr1","ADDRESS 2":"addr2","CITY":"city","STATE":"state","ZIP":"zip"';
				JSONobj = JSONobj+'}';
				var fileObjInternalIds = file.create({
                        name: "Subsidiary Internal Ids",
                        fileType: file.Type.PLAINTEXT,
                        contents: JSONobj,
                        folder: scriptparamId
                    });
					 var fileSave_JSON = fileObjInternalIds.save();
					 log.audit('fileSave_JSON',fileSave_JSON);
					 
				/////////////////////////////////////////////////////////////////////
     				var countryField = recordObj.getField('custrecord150');
					var countryOptions = countryField.getSelectOptions();
					var JSONString = '{';
					for(var k=0;k<countryOptions.length;k++) {
					   var id = countryOptions[k].value;
					   var text = countryOptions[k].text;
					   if(k == countryOptions.length-1)
					JSONString = JSONString+JSON.stringify(text)+':'+ JSON.stringify(id);
					else
					JSONString = JSONString+JSON.stringify(text)+':'+ JSON.stringify(id)+',';	
					}
                   JSONString = JSONString+'}';
				   var stateIdJson = file.create({
                        name: "State internalIds",
                        fileType: file.Type.PLAINTEXT,
                        contents: JSONString,
                        folder: scriptparamId
                    });
			   var stateSave_JSON = stateIdJson.save();
			   log.debug('StateCodes',stateSave_JSON);
                var finalTemplate = "";
				finalTemplate = finalTemplate + "Internal Id,Company Code,Name,Subsubsidiary of,";
				finalTemplate = finalTemplate + recordFieldLabels.toString();
				finalTemplate = finalTemplate + 'ATTENTION,ADDRESSEE,PHONE,ADDRESS 1,ADDRESS 2,CITY,STATE,ZIP';
                log.debug('finalTemplate',finalTemplate);
				 
				

                var fileObj = file.create({
                    name: 'DefaultTemplate.csv',
                    fileType: file.Type.PLAINTEXT,
                    contents: finalTemplate,
                    folder: scriptparamId
                });
			    var fileId = fileObj.save();
				var fileloderObj = file.load({
								id: fileId
							});
				var fileUrl = fileloderObj.url;
				fileUrl = fileUrl+'&_xd=T'
				log.debug('fileUrl',fileUrl);
				form.addSubmitButton({
									label : 'Upload Subsidiary'
								}); 
				
					if(flag!=1)
					{
					
					//var Suitelet_url = "https://system.netsuite.com/core/media/media.nl?id="+fileId+"&c=TSTDRV1151650&h=33b0b9c910552cc7aaff&_xd=T&_xt=.csv"
					var Suitelet_url = fileUrl;
					log.debug('Suitelet_url',Suitelet_url);

			            var window_new_open= 'window.open(\''+Suitelet_url+'\',\'_blank\', \'\')';		
						form.addButton({
							id : '_downloadlink',
							label : 'Download Template to Create Subsidiary',
							functionName: window_new_open
						});
						
						var window_new_open_update= 'window.open(\''+Suitelet_url+'\',\'_blank\', \'\')';		
						form.addButton({
							id : '_downloadlink_update',
							label : 'Download Template to Update Subsidiary',
							functionName: window_new_open_update
						});
						
					}
					else if(flag == 1 && upload =='T')
					{
				    var fileUploads = form.addField({
                    id: '_upload_file',
                    type: serverWidget.FieldType.FILE,
                    label: 'Select File To Upload',
                   });
				     
					}
					
					if(flag!=1)
					{
					
					var instructstring = '';
					instructstring+= '<html>';
					instructstring+= '<body>';
					instructstring+= '<div style="background-color:#FFFFFF;">';
					instructstring+= '<p>&nbsp;</p>';
					//instructstring+= '<p>&nbsp;</p>';
					
					instructstring+= '<p>&nbsp;</p>';
					instructstring+= '<p>&nbsp;</p>';
					instructstring+= '<div style="background-color:#607799;border:4px;">';
					instructstring+= '<h1 style="font-size:150%;font-weight:600;color:#FFFFFF;margin-left:2px;">Please read the below instructions carefully!</h1><br/>';
					instructstring+= '</div>';
					//instructstring+= '<p>&nbsp;</p>';
					instructstring+= '<div style="background-color:#E6E6FA;">';
					instructstring+= '<p>&nbsp;</p>';
					instructstring+= '<p style="font-size:130%;margin-left: 4px;">1. Download the sample CSV template by clicking on the "Download Template to Create Subsidiary" button for creating new subsidiaries.</p><br/>';
					instructstring+= '<p style="font-size:130%;margin-left: 4px;">2. Download the sample CSV template by clicking on the "Download Template to Update Subsidiary" button for updating existing subsidiaries.</p><br/>';
					instructstring+= '<p style="font-size:130%;margin-left: 4px;">3. Please enter the data in the downloaded CSV file.</p><br/>';
					instructstring+= '<p style="font-size:130%;margin-left: 4px;">4. Ensure to give "true" or "false" for the checkbox fields.</p><br/>';
					instructstring+= '<p style="font-size:130%;margin-left: 4px;">5. Ensure to give the parent-child relationship properly.</p><br/>';
					instructstring+= '<p style="font-size:130%;margin-left: 4px;">6. Please use the CSV file with proper data and click on "Upload Subsidiary" Button to upload the CSV file into NetSuite.</p><br/>';
					//instructstring+= '<p style="font-size:130%;">6.Please choose the CSV file with proper data and then click on upload button again.</p><br/>';
					instructstring+= '</div>';
					instructstring+= '<p>&nbsp;</p>';
					instructstring+= '<p>&nbsp;</p>';
					instructstring+= '</div>';
					instructstring+= '</body>';
					instructstring+= '</html>';
					var defaultMessage = form.addField({
							id : 'custpage_default_message',
							type : serverWidget.FieldType.INLINEHTML,
							label : 'Note:'
								}).defaultValue = instructstring;
					}
				//defaultMessage.layoutType = serverWidget.FieldLayoutType.MIDROW;
				context.response.writePage(form);
					
					
                	
					} else {
                var isTemplateDownload = context.request.parameters.download;
                var fileUploadData = context.request.files._upload_file;
                if (fileUploadData) {
                    fileUploadData = fileUploadData.getContents();
                    log.debug('fileUploadData', fileUploadData);
                    //creating the file in filecabinet of the file that the operation is performed on
					var date = new Date();
                var currentdate = date.getDate();
                var month = date.getMonth();
                var year = date.getYear();

                var hours = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
                var milliSec = date.getMilliseconds();
                date = date.toString();
					var fileName = 'SUB_' + currentdate + month + year + 'T' + hours + minutes + seconds + milliSec;
                    var fileObj = file.create({
                        name: fileName,
                        fileType: file.Type.CSV,
                        contents: fileUploadData,
                        folder: 3124
                    });
                    var fileSave = fileObj.save();
                    log.debug('fileSave', fileSave);
					log.debug('fileSave_JSON2', fileSave_JSON);
					var delete_task = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_ns_mr_subsidiary_import',
                            deploymentId: 'customdeploy_subsidiary_import',
                            params: {
                                custscript_new_file_data: fileSave,
								custscript_subsidiary_internalid_fileid: fileSave_JSON,
								custscript_state_internalid_fileid:stateSave_JSON
								}
                        });
                        var mrTaskId = delete_task.submit();
						var form = serverWidget.createForm({
                        title: ' '
                    });
                    var uploadConfirmation = serverWidget.createForm({
                        title: 'Your Request has been received. Tool will import the subsidiaries shortly. ThankYou!'
                    });
                    context.response.writePage(uploadConfirmation);
                    

                }
				else
				{
				redirect.toSuitelet({
                      scriptId: 'customscript_subsidiary_import_assist',
                      deploymentId: 'customdeploy1',
                      parameters: {
                          'isTemplateDownload': isTemplateDownload,
                          'isUpload': 'T',
						  'testflag':1
                          }
                  })
					}
			}
                
        }
		catch(e)
		{
			log.debug('error',e);
		}
	}
        return {
            onRequest:onRequest
        };
    });