
exports.internal_server_error                = { status: 500, value:  0, message: 'Internal server error' };
exports.generic_upload_error                 = { status: 500, value:  1, message: 'Upload error' };
exports.generic_download_error               = { status: 500, value:  2, message: 'Download error' };
exports.authentication_fail                  = { status: 401, value:  3, message: 'Incorrect username or password' };
exports.authentication_error                 = { status: 401, value:  4, message: 'Authentication error' };
exports.generic_request_error                = { status: 400, value:  5, message: 'The request has errors' };
exports.post_request_error                   = { status: 400, value:  6, message: 'Resource not created' };
exports.get_request_error                    = { status: 400, value:  7, message: 'Search request error' };
exports.delete_request_error                 = { status: 400, value:  8, message: 'Delete request error' };
exports.put_request_error                    = { status: 400, value:  9, message: 'Modify request error' };
exports.resource_not_found                   = { status: 404, value: 10, message: 'Resource Not found' };
exports.restricted_access                    = { status: 403, value: 11, message: 'You cannot access this resource' };
exports.admin_restricted_access              = { status: 403, value: 12, message: 'Only administrators can make this request' };
exports.demo_content_request_not_implemented = { status: 403, value: 13, message: 'Demo content on the request not yet implemented' };
exports.not_yours                            = { status: 403, value: 14, message: 'You are not the owner of this resource' };
exports.already_used                         = { status: 403, value: 15, message: 'The resource is already used' };
exports.missing_info                         = { status: 401, value: 16, message: 'Please, provide some info to modify the resource' }; 
exports.user_authorization_error             = { status: 401, value: 17, message: 'Only the administrator can manage users' };

exports.computation_code_required            = { status: 404, value: 18, message: 'Please, provide the code to execute for the computation' };
exports.computation_filter_required          = { status: 403, value: 19, message: 'Only the owner can delete' };
exports.computation_code_unknown             = { status: 404, value: 20, message: 'The provided code is not recognized as valid' };      

exports.measurement_authorization_error      = { status: 401, value: 21, message: 'Only the owner can access a measurement' };
exports.measurement_delete_needs_filter      = { status: 403, value: 22, message: 'To delete multiple measurement you have to provide a filter' };

exports.manage = function(res, error, more) {
    if( typeof more === 'object' && more !== null) more = more.toString();
    if(!error) error = this.internal_server_error;
    error.details = more;
    return res.status(error.status).json(error); 
}
